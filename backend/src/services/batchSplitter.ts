/**
 * Splits an array of rows into smaller batches for Gemini API processing.
 * Each batch is processed independently to stay within token limits.
 */

import { BATCH_SIZE } from '../config/constants';

/**
 * Split rows into batches of the specified size.
 * @param rows - Array of CSV row objects
 * @param batchSize - Maximum rows per batch (default from constants)
 * @returns Array of batch arrays
 */
export function splitIntoBatches<T>(
  rows: T[],
  batchSize: number = BATCH_SIZE
): T[][] {
  if (rows.length === 0) {
    return [];
  }

  const batches: T[][] = [];

  for (let i = 0; i < rows.length; i += batchSize) {
    batches.push(rows.slice(i, i + batchSize));
  }

  return batches;
}
