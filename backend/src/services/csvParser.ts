/**
 * Server-side CSV parser using the csv-parse library.
 * Handles quoted fields, escaped commas, and newlines within quotes.
 */

import { parse } from 'csv-parse/sync';
import type { ParsedCSV } from '../types/crm';

/**
 * Parse a CSV file buffer into structured rows and column names.
 * @throws Error if the buffer is empty, parsing fails, or no data rows exist.
 */
export function parseCSVFile(fileBuffer: Buffer): ParsedCSV {
  const content = fileBuffer.toString('utf-8').trim();

  if (!content) {
    throw Object.assign(new Error('CSV file is empty'), {
      statusCode: 400,
      code: 'EMPTY_CSV',
    });
  }

  try {
    const records: Record<string, string>[] = parse(content, {
      columns: true,           // Use first row as column headers
      skip_empty_lines: true,  // Ignore blank lines
      trim: true,              // Trim whitespace from fields
      relax_quotes: true,      // Handle improperly quoted fields gracefully
      relax_column_count: true,// Handle rows with mismatched column counts
      cast: false,             // Keep all values as strings
    });

    if (records.length === 0) {
      throw Object.assign(new Error('CSV has no data rows (only headers found)'), {
        statusCode: 400,
        code: 'NO_DATA_ROWS',
      });
    }

    // Extract column names from the first record's keys
    const columns = Object.keys(records[0]);

    if (columns.length === 0) {
      throw Object.assign(new Error('CSV has no columns'), {
        statusCode: 400,
        code: 'NO_COLUMNS',
      });
    }

    return { rows: records, columns };
  } catch (error) {
    // Re-throw our custom errors as-is
    if (error instanceof Error && 'statusCode' in error) {
      throw error;
    }

    // Wrap csv-parse errors
    throw Object.assign(
      new Error(`Invalid CSV format: ${error instanceof Error ? error.message : 'Unknown error'}`),
      { statusCode: 400, code: 'INVALID_CSV' }
    );
  }
}
