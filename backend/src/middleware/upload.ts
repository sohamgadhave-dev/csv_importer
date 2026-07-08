/**
 * Multer middleware for CSV file uploads.
 * Uses memory storage (no disk writes) and restricts to .csv files under 10MB.
 */

import multer from 'multer';
import { MAX_FILE_SIZE } from '../config/constants';

const storage = multer.memoryStorage();

export const uploadMiddleware = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    const isCSV =
      file.originalname.toLowerCase().endsWith('.csv') ||
      file.mimetype === 'text/csv' ||
      file.mimetype === 'application/vnd.ms-excel';

    if (!isCSV) {
      cb(new Error('Only CSV files are allowed'));
      return;
    }
    cb(null, true);
  },
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
});
