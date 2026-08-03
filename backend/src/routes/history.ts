/**
 * History routes — list and retrieve past imports.
 * GET /api/imports     — List all imports for a browser
 * GET /api/imports/:id — Get a specific import with full records
 */

import { Router, Request, Response, NextFunction } from 'express';
import { getPool } from '../db/connection';
import type { ImportRow } from '../db/queries';

const router = Router();

/**
 * GET /api/imports
 * Returns all imports for the current browser (by browserId),
 * sorted most recent first.
 */
router.get(
  '/',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const browserId =
        req.cookies?.browserId ||
        (req.headers['x-browser-id'] as string) ||
        (req.query.browserId as string);

      if (!browserId) {
        res.status(200).json({ imports: [] });
        return;
      }

      // Return summaries (exclude full record arrays for performance)
      const [imports] = await getPool().query<import('mysql2').RowDataPacket[]>(
        `SELECT id as _id, original_filename as originalFilename, total_imported as totalImported, total_skipped as totalSkipped, created_at as createdAt 
         FROM imports 
         WHERE browser_id = ? 
         ORDER BY created_at DESC`,
        [browserId]
      );

      res.status(200).json({ imports });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/imports/:id
 * Returns full details of a specific import, including all CRM records.
 * Verifies the browserId matches for security.
 */
router.get(
  '/:id',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const browserId =
        req.cookies?.browserId ||
        (req.headers['x-browser-id'] as string) ||
        (req.query.browserId as string);

      // Fetch import record
      const [importRows] = await getPool().query<import('mysql2').RowDataPacket[]>(
        `SELECT id as _id, original_filename as originalFilename, browser_id as browserId, total_imported as totalImported, total_skipped as totalSkipped, created_at as createdAt 
         FROM imports WHERE id = ?`,
        [id]
      );

      const importRecord = importRows[0];

      if (!importRecord) {
        res.status(404).json({
          error: 'Import not found',
          code: 'NOT_FOUND',
        });
        return;
      }

      // Security check: only allow access to own imports
      if (importRecord.browserId !== browserId) {
        res.status(403).json({
          error: 'Access denied',
          code: 'FORBIDDEN',
        });
        return;
      }

      // Fetch related records
      const [crmRows] = await getPool().query<import('mysql2').RowDataPacket[]>(
        `SELECT * FROM crm_records WHERE import_id = ?`,
        [id]
      );

      const [skippedRows] = await getPool().query<import('mysql2').RowDataPacket[]>(
        `SELECT \`row_number\` as rowNumber, reason, raw_data as data FROM skipped_records WHERE import_id = ?`,
        [id]
      );

      importRecord.crmRecords = crmRows.map(row => ({
        name: row.name,
        email: row.email,
        mobile_without_country_code: row.phone,
        company: row.company,
        city: row.city,
        state: row.state,
        country: row.country,
        crm_status: row.crm_status,
        data_source: row.data_source,
        crm_note: row.notes,
      }));

      importRecord.skippedRecords = skippedRows.map(row => ({
        rowNumber: row.rowNumber,
        reason: row.reason,
        data: row.data, // assuming raw_data is parsed automatically by mysql2 if it's JSON type
      }));

      res.status(200).json(importRecord);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
