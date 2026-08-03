/**
 * Import route — handles CSV upload, AI processing, and record creation.
 * POST /api/import
 */

import { Router, Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { uploadMiddleware } from '../middleware/upload';
import { parseCSVFile } from '../services/csvParser';
import { splitIntoBatches } from '../services/batchSplitter';
import { extractCRMRecords } from '../services/aiExtractor';
import { validateAndCleanRecords } from '../services/recordValidator';
import { dbHelpers } from '../db/queries';
import { BATCH_SIZE } from '../config/constants';
import type { CRMRecord, SkippedRecord } from '../types/crm';

const router = Router();

/**
 * POST /api/import
 * Accepts a CSV file upload, processes it through Gemini AI,
 * validates the results, saves to MongoDB, and returns the import summary.
 */
router.post(
  '/',
  uploadMiddleware.single('file'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // 1. Validate file exists
      if (!req.file) {
        res.status(400).json({
          error: 'No file provided. Please upload a CSV file.',
          code: 'NO_FILE',
        });
        return;
      }

      // 2. Set headers for SSE (Server-Sent Events)
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      // 3. Extract or generate browserId for session isolation
      let browserId = req.cookies?.browserId ||
        req.headers['x-browser-id'] as string ||
        req.body?.browserId;

      if (!browserId) {
        browserId = uuidv4();
      }

      // Set browserId cookie for future requests
      // Note: we can still set cookies even with text/event-stream, as long as it's the initial headers
      res.cookie('browserId', browserId, {
        httpOnly: true,
        maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
        sameSite: 'none',
        secure: process.env.NODE_ENV === 'production',
      });

      const originalFilename = req.file.originalname;
      console.log(`📁 Processing file: ${originalFilename} (${req.file.size} bytes)`);

      // 4. Parse CSV
      const { rows, columns } = parseCSVFile(req.file.buffer);
      console.log(`📊 Parsed ${rows.length} rows with ${columns.length} columns`);

      // 5. Split into batches
      const batches = splitIntoBatches(rows, BATCH_SIZE);
      console.log(`🔄 Split into ${batches.length} batch(es) of up to ${BATCH_SIZE} rows`);

      // 6. Process batches through AI (2 concurrent for speed)
      const allImportedRecords: CRMRecord[] = [];
      const allSkippedRecords: SkippedRecord[] = [];
      let completedBatches = 0;
      const CONCURRENCY = 2;

      for (let i = 0; i < batches.length; i += CONCURRENCY) {
        const chunk = batches.slice(i, i + CONCURRENCY);

        await Promise.all(
          chunk.map(async (batch, idx) => {
            const batchIndex = i + idx;
            const batchOffset = batchIndex * BATCH_SIZE;

            console.log(
              `🤖 Processing batch ${batchIndex + 1}/${batches.length} (${batch.length} rows)...`
            );

            try {
              const extractedRecords = await extractCRMRecords(batch, columns);
              const { valid, skipped } = validateAndCleanRecords(extractedRecords, batchOffset);

              allImportedRecords.push(...valid);
              allSkippedRecords.push(...skipped);

              if (extractedRecords.length < batch.length) {
                const skippedCount = batch.length - extractedRecords.length;
                for (let j = 0; j < skippedCount; j++) {
                  allSkippedRecords.push({
                    rowNumber: batchOffset + extractedRecords.length + j + 1,
                    data: { _note: 'Record filtered by AI (likely missing email/phone)' },
                    reason: 'Filtered by AI - no email or mobile number',
                  });
                }
              }
            } catch (batchError) {
              console.error(
                `❌ Batch ${batchIndex + 1} failed:`,
                batchError instanceof Error ? batchError.message : batchError
              );
              for (let j = 0; j < batch.length; j++) {
                allSkippedRecords.push({
                  rowNumber: batchOffset + j + 1,
                  data: batch[j],
                  reason: `AI processing failed: ${batchError instanceof Error ? batchError.message : 'Unknown error'}`,
                });
              }
            }

            // Stream progress after each batch completes
            completedBatches++;
            res.write(`data: ${JSON.stringify({
              type: 'progress',
              currentBatch: completedBatches,
              totalBatches: batches.length
            })}\n\n`);
          })
        );
      }

      // Sort by row number since parallel batches may finish out of order
      allSkippedRecords.sort((a, b) => a.rowNumber - b.rowNumber);

      // --- DUPLICATE LEAD DETECTION (Intra-CSV) ---
      console.log('🔍 Checking for duplicate leads...');
      const seenEmails = new Set<string>();
      const seenPhones = new Set<string>();
      
      const uniqueRecords: CRMRecord[] = [];
      const duplicateRecords: SkippedRecord[] = [];

      for (let i = 0; i < allImportedRecords.length; i++) {
        const record = allImportedRecords[i];
        let isDuplicate = false;
        let duplicateReason = '';

        if (record.email && seenEmails.has(record.email.toLowerCase())) {
          isDuplicate = true;
          duplicateReason = `Duplicate email: ${record.email}`;
        } else if (
          record.mobile_without_country_code && 
          seenPhones.has(record.mobile_without_country_code)
        ) {
          isDuplicate = true;
          duplicateReason = `Duplicate phone: ${record.mobile_without_country_code}`;
        }

        if (isDuplicate) {
          duplicateRecords.push({
            rowNumber: -1, // We lost exact row number during AI processing batching, but it's a duplicate
            data: record as unknown as Record<string, string>,
            reason: duplicateReason,
          });
        } else {
          uniqueRecords.push(record);
          if (record.email) seenEmails.add(record.email.toLowerCase());
          if (record.mobile_without_country_code) seenPhones.add(record.mobile_without_country_code);
        }
      }

      if (duplicateRecords.length > 0) {
        console.log(`⚠️ Found ${duplicateRecords.length} duplicate records.`);
        allSkippedRecords.push(...duplicateRecords);
      }

      console.log(
        `✅ Processing complete: ${uniqueRecords.length} imported, ${allSkippedRecords.length} skipped`
      );

      // 7. Save to MySQL with Transaction
      const connection = await dbHelpers.getConnection();
      let importId: number;

      try {
        await connection.beginTransaction();

        // Insert into imports table
        const [importResult] = await connection.execute<import('mysql2').ResultSetHeader>(
          `INSERT INTO imports (original_filename, browser_id, total_imported, total_skipped) 
           VALUES (?, ?, ?, ?)`,
          [originalFilename, browserId, uniqueRecords.length, allSkippedRecords.length]
        );
        importId = importResult.insertId;

        // Bulk insert CRM records
        if (uniqueRecords.length > 0) {
          const crmValues = dbHelpers.formatCRMRecordsForInsert(importId, uniqueRecords);
          await connection.query(
            `INSERT INTO crm_records 
             (import_id, name, email, phone, company, city, state, country, crm_status, data_source, notes) 
             VALUES ?`,
            [crmValues]
          );
        }

        // Bulk insert skipped records
        if (allSkippedRecords.length > 0) {
          const skippedValues = dbHelpers.formatSkippedRecordsForInsert(importId, allSkippedRecords);
          await connection.query(
            `INSERT INTO skipped_records (import_id, \`row_number\`, reason, raw_data) 
             VALUES ?`,
            [skippedValues]
          );
        }

        await connection.commit();
        console.log(`💾 Saved import record: ${importId}`);
      } catch (dbError) {
        await connection.rollback();
        console.error('❌ Database transaction failed, rolled back:', dbError);
        throw dbError;
      } finally {
        connection.release();
      }

      // --- STREAM COMPLETE EVENT ---
      res.write(`data: ${JSON.stringify({
        type: 'complete',
        importId: importId,
        importedRecords: uniqueRecords,
        skippedRecords: allSkippedRecords,
        totalImported: uniqueRecords.length,
        totalSkipped: allSkippedRecords.length,
      })}\n\n`);

      res.end();
    } catch (error) {
      console.error('Fatal import error:', error);

      // If headers are already sent, stream the error. Otherwise use standard next() error handler.
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({
          type: 'error',
          message: error instanceof Error ? error.message : 'Unknown server error'
        })}\n\n`);
        res.end();
      } else {
        next(error);
      }
    }
  }
);

export default router;
