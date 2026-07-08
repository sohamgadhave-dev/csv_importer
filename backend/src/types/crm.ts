/**
 * CRM Record type definitions — shared between frontend and backend.
 * These types define the standardized CRM schema that all CSV records
 * are normalized into via AI extraction.
 */

/** Allowed CRM lead status values */
export type CRMStatus =
  | 'GOOD_LEAD_FOLLOW_UP'
  | 'DID_NOT_CONNECT'
  | 'BAD_LEAD'
  | 'SALE_DONE';

/** Allowed data source values */
export type DataSource =
  | 'leads_on_demand'
  | 'meridian_tower'
  | 'eden_park'
  | 'varah_swamy'
  | 'sarjapur_plots'
  | '';

/** A single cleaned CRM record after AI extraction and validation */
export interface CRMRecord {
  created_at: string;
  name: string;
  email: string;
  country_code: string;
  mobile_without_country_code: string;
  company: string;
  city: string;
  state: string;
  country: string;
  lead_owner: string;
  crm_status: CRMStatus | '';
  crm_note: string;
  data_source: DataSource;
  possession_time: string;
  description: string;
}

/** A record that was skipped during import, with the reason */
export interface SkippedRecord {
  rowNumber: number;
  data: Record<string, unknown>;
  reason: string;
}

/** Response from the POST /api/import endpoint */
export interface ImportResponse {
  importedRecords: CRMRecord[];
  skippedRecords: SkippedRecord[];
  totalImported: number;
  totalSkipped: number;
}

/** A past import record stored in MongoDB */
export interface PastImport {
  _id: string;
  browserId: string;
  originalFilename: string;
  createdAt: string;
  totalImported: number;
  totalSkipped: number;
  crmRecords: CRMRecord[];
  skippedRecords: SkippedRecord[];
}

/** Parsed CSV result */
export interface ParsedCSV {
  rows: Record<string, string>[];
  columns: string[];
}
