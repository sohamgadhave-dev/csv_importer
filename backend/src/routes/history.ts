/**
 * History routes — list and retrieve past imports.
 * GET /api/imports     — List all imports for a browser
 * GET /api/imports/:id — Get a specific import with full records
 */

import { Router, Request, Response, NextFunction } from 'express';
import { Import } from '../models/Import';

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
      const imports = await Import.find({ browserId })
        .select('originalFilename totalImported totalSkipped createdAt')
        .sort({ createdAt: -1 })
        .lean();

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

      const importRecord = await Import.findById(id).lean();

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

      res.status(200).json(importRecord);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
