import { getPool } from './connection';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import type { CRMRecord, SkippedRecord } from '../types/crm';

export interface ImportRow extends RowDataPacket {
  id: number;
  original_filename: string;
  browser_id: string;
  total_imported: number;
  total_skipped: number;
  created_at: Date;
}

/**
 * Reusable helper functions for the MySQL database
 */

export const dbHelpers = {
  /**
   * Helper for starting a transaction.
   * Returns a connection that MUST be released or committed/rolled back.
   */
  async getConnection() {
    return await getPool().getConnection();
  },

  /**
   * Format an array of CRM records for bulk insert
   */
  formatCRMRecordsForInsert(importId: number, records: CRMRecord[]) {
    return records.map((record) => [
      importId,
      record.name || null,
      record.email || null,
      record.mobile_without_country_code || null, // Mapping phone
      record.company || null,
      record.city || null,
      record.state || null,
      record.country || null,
      'New', // default status
      record.data_source || null,
      record.crm_note || null,
    ]);
  },

  /**
   * Format an array of skipped records for bulk insert
   */
  formatSkippedRecordsForInsert(importId: number, records: SkippedRecord[]) {
    return records.map((record) => [
      importId,
      record.rowNumber,
      record.reason,
      JSON.stringify(record.data),
    ]);
  }
};
