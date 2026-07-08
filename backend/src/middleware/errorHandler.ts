/**
 * Centralized error handling middleware for Express.
 * Catches all errors thrown in routes/middleware and returns
 * a consistent JSON error response.
 */

import { Request, Response, NextFunction } from 'express';

interface AppError extends Error {
  statusCode?: number;
  code?: string;
}

export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Log the error (use a proper logger in production)
  console.error(`[ERROR] ${err.code || 'UNKNOWN'}: ${err.message}`);
  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }

  // Handle Multer-specific errors
  if (err.message === 'Only CSV files are allowed') {
    res.status(400).json({
      error: 'Only CSV files are allowed',
      code: 'INVALID_FILE_TYPE',
    });
    return;
  }

  if (err.message?.includes('File too large')) {
    res.status(413).json({
      error: 'File size exceeds 10MB limit',
      code: 'FILE_TOO_LARGE',
    });
    return;
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  const code = err.code || 'UNKNOWN_ERROR';

  res.status(statusCode).json({
    error: message,
    code,
  });
}

/**
 * Helper to create typed errors with status codes.
 */
export function createAppError(
  message: string,
  statusCode: number,
  code: string
): AppError {
  const error: AppError = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  return error;
}
