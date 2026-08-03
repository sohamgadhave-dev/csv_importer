/**
 * Application-wide constants — enum values, limits, and AI configuration.
 * Centralizing these avoids magic strings/numbers scattered through the codebase.
 */

/** Valid CRM lead status values that Gemini must output */
export const ALLOWED_CRM_STATUSES = [
  'GOOD_LEAD_FOLLOW_UP',
  'DID_NOT_CONNECT',
  'BAD_LEAD',
  'SALE_DONE',
] as const;

/** Valid data source identifiers */
export const ALLOWED_DATA_SOURCES = [
  'leads_on_demand',
  'meridian_tower',
  'eden_park',
  'varah_swamy',
  'sarjapur_plots',
] as const;

/** Number of CSV rows sent per Gemini API call */
export const BATCH_SIZE = 20;

/** Maximum upload file size in bytes (10 MB) */
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

/** Gemini model identifier */
export const GEMINI_MODEL = 'gemini-2.0-flash';

/** Groq model identifier for fallback */
export const GROQ_MODEL = 'llama-3.1-8b-instant';

/** Maximum tokens for Gemini/Groq response */
export const GEMINI_MAX_TOKENS = 4096;

/** Number of retry attempts for failed Gemini API calls */
export const GEMINI_RETRY_COUNT = 1;

/** Delay between retries in milliseconds */
export const GEMINI_RETRY_DELAY_MS = 500;
