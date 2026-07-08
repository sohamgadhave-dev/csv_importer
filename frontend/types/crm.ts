/**
 * CRM type definitions shared across the frontend application.
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

/** A single cleaned CRM record after AI extraction */
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

/** A record that was skipped during import */
export interface SkippedRecord {
  rowNumber: number;
  data: Record<string, unknown>;
  reason: string;
}

/** Response from POST /api/import */
export interface ImportResponse {
  importId: string;
  importedRecords: CRMRecord[];
  skippedRecords: SkippedRecord[];
  totalImported: number;
  totalSkipped: number;
}

/** Summary of a past import (for list view) */
export interface PastImportSummary {
  _id: string;
  originalFilename: string;
  createdAt: string;
  totalImported: number;
  totalSkipped: number;
}

/** Full past import with all records (for detail view) */
export interface PastImport extends PastImportSummary {
  browserId: string;
  crmRecords: CRMRecord[];
  skippedRecords: SkippedRecord[];
}

/** Parsed CSV result from client-side parsing */
export interface ParsedCSV {
  rows: Record<string, string>[];
  columns: string[];
}

/** CRM field display names for table headers */
export const CRM_FIELD_LABELS: Record<keyof CRMRecord, string> = {
  created_at: 'Created At',
  name: 'Name',
  email: 'Email',
  country_code: 'Country Code',
  mobile_without_country_code: 'Mobile',
  company: 'Company',
  city: 'City',
  state: 'State',
  country: 'Country',
  lead_owner: 'Lead Owner',
  crm_status: 'CRM Status',
  crm_note: 'CRM Note',
  data_source: 'Data Source',
  possession_time: 'Possession Time',
  description: 'Description',
};

/** Ordered list of CRM fields for table column rendering */
export const CRM_FIELDS: (keyof CRMRecord)[] = [
  'created_at',
  'name',
  'email',
  'country_code',
  'mobile_without_country_code',
  'company',
  'city',
  'state',
  'country',
  'lead_owner',
  'crm_status',
  'crm_note',
  'data_source',
  'possession_time',
  'description',
];
