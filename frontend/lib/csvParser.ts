/**
 * Client-side CSV parser using PapaParse.
 * Parses CSV files in the browser before sending to the backend.
 */

import Papa from 'papaparse';
import type { ParsedCSV } from '@/types/crm';

/** Maximum file size in bytes (10 MB) */
const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Parse a CSV file on the client side.
 * @param file - The CSV File object from file input or drag & drop
 * @returns Parsed rows (as objects) and column names
 * @throws Error if file is invalid, empty, or too large
 */
export function parseCSVFile(file: File): Promise<ParsedCSV> {
  return new Promise((resolve, reject) => {
    // Validate file type
    if (!file.name.toLowerCase().endsWith('.csv')) {
      reject(new Error('Please select a CSV file'));
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      reject(new Error('File size exceeds 10MB limit'));
      return;
    }

    if (file.size === 0) {
      reject(new Error('File is empty'));
      return;
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header: string) => header.trim(),
      complete: (results) => {
        if (results.errors.length > 0) {
          // Filter out non-critical errors
          const criticalErrors = results.errors.filter(
            (e) => e.type !== 'FieldMismatch'
          );

          if (criticalErrors.length > 0) {
            reject(
              new Error(`CSV parsing error: ${criticalErrors[0].message}`)
            );
            return;
          }
        }

        const rows = results.data as Record<string, string>[];

        if (rows.length === 0) {
          reject(new Error('CSV file has no data rows'));
          return;
        }

        const columns = results.meta.fields || Object.keys(rows[0]);

        if (columns.length === 0) {
          reject(new Error('CSV file has no columns'));
          return;
        }

        resolve({ rows, columns });
      },
      error: (error: Error) => {
        reject(new Error(`Failed to parse CSV: ${error.message}`));
      },
    });
  });
}
