import { Router, Request, Response, NextFunction } from 'express';
import { getPool } from '../db/connection';
import type { RowDataPacket } from 'mysql2';

const router = Router();

/**
 * GET /api/records
 * Retrieve CRM records with pagination and search.
 */
router.get(
  '/',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const searchName = req.query.name as string;
      const searchCompany = req.query.company as string;
      const searchEmail = req.query.email as string;

      const offset = (page - 1) * limit;
      const pool = getPool();

      let query = `SELECT * FROM crm_records WHERE 1=1`;
      const queryParams: any[] = [];
      let countQuery = `SELECT COUNT(*) as total FROM crm_records WHERE 1=1`;
      const countParams: any[] = [];

      if (searchName) {
        query += ` AND name LIKE ?`;
        countQuery += ` AND name LIKE ?`;
        queryParams.push(`%${searchName}%`);
        countParams.push(`%${searchName}%`);
      }
      if (searchCompany) {
        query += ` AND company LIKE ?`;
        countQuery += ` AND company LIKE ?`;
        queryParams.push(`%${searchCompany}%`);
        countParams.push(`%${searchCompany}%`);
      }
      if (searchEmail) {
        query += ` AND email LIKE ?`;
        countQuery += ` AND email LIKE ?`;
        queryParams.push(`%${searchEmail}%`);
        countParams.push(`%${searchEmail}%`);
      }

      query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
      queryParams.push(limit, offset);

      const [rows] = await pool.query<RowDataPacket[]>(query, queryParams);
      const [countResult] = await pool.query<RowDataPacket[]>(countQuery, countParams);

      const total = countResult[0].total;

      res.status(200).json({
        data: rows,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
