import { Router, Request, Response, NextFunction } from 'express';
import { getPool } from '../db/connection';
import type { RowDataPacket } from 'mysql2';

const router = Router();

/**
 * GET /api/reports
 * Returns aggregate metrics for reports dashboard using SQL functions.
 */
router.get(
  '/',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const pool = getPool();

      // Total Imports & Average records per import
      const [importStatsRows] = await pool.query<RowDataPacket[]>(
        `SELECT 
           COUNT(*) as totalImports,
           AVG(total_imported) as averageRecordsPerImport
         FROM imports`
      );

      // Total Records
      const [totalRecordsRows] = await pool.query<RowDataPacket[]>(
        `SELECT COUNT(*) as totalRecords FROM crm_records`
      );

      // Top Companies
      const [topCompaniesRows] = await pool.query<RowDataPacket[]>(
        `SELECT company, COUNT(*) as count 
         FROM crm_records 
         WHERE company IS NOT NULL AND company != ''
         GROUP BY company 
         ORDER BY count DESC 
         LIMIT 5`
      );

      // Status Distribution
      const [statusRows] = await pool.query<RowDataPacket[]>(
        `SELECT crm_status, COUNT(*) as count 
         FROM crm_records 
         GROUP BY crm_status`
      );

      // Latest Import
      const [latestImportRows] = await pool.query<RowDataPacket[]>(
        `SELECT id, original_filename, created_at, total_imported 
         FROM imports 
         ORDER BY created_at DESC 
         LIMIT 1`
      );

      const importStats = importStatsRows[0];
      const totalRecords = totalRecordsRows[0].totalRecords;
      const latestImport = latestImportRows[0] || null;

      res.status(200).json({
        totalRecords,
        totalImports: importStats.totalImports,
        averageRecordsPerImport: Math.round(importStats.averageRecordsPerImport || 0),
        latestImport,
        topCompanies: topCompaniesRows,
        statusDistribution: statusRows,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
