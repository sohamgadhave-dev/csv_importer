/**
 * Record validator using Zod schemas.
 * Validates AI-extracted records against the CRM schema,
 * separating valid records from skipped ones (with reasons).
 */

import { z } from 'zod';
import { ALLOWED_CRM_STATUSES, ALLOWED_DATA_SOURCES } from '../config/constants';
import type { CRMRecord, SkippedRecord } from '../types/crm';

/** Zod schema for a single CRM record */
const CRMRecordSchema = z.object({
  created_at: z.string().refine(
    (d) => {
      if (!d || d.trim() === '') return true; // Allow empty, will be set to current date
      return !isNaN(Date.parse(d));
    },
    { message: 'created_at must be a valid date string' }
  ),
  name: z.string().default(''),
  email: z.string().default(''),
  country_code: z.string().default(''),
  mobile_without_country_code: z.string().default(''),
  company: z.string().default(''),
  city: z.string().default(''),
  state: z.string().default(''),
  country: z.string().default(''),
  lead_owner: z.string().default(''),
  crm_status: z.string().default(''),
  crm_note: z.string().default(''),
  data_source: z.string().default(''),
  possession_time: z.string().default(''),
  description: z.string().default(''),
});

/**
 * Validate and clean an array of AI-extracted records.
 * Records without both email AND mobile are skipped.
 * Invalid enum values are normalized to empty strings.
 *
 * @param records - Raw records from Gemini AI
 * @param startRowOffset - Row number offset for tracking original CSV positions
 * @returns Object containing valid CRM records and skipped records with reasons
 */
export function validateAndCleanRecords(
  records: unknown[],
  startRowOffset: number = 0
): { valid: CRMRecord[]; skipped: SkippedRecord[] } {
  const valid: CRMRecord[] = [];
  const skipped: SkippedRecord[] = [];

  for (let i = 0; i < records.length; i++) {
    const rawRecord = records[i];
    const rowNumber = startRowOffset + i + 1; // 1-based row numbers

    try {
      // Parse with Zod (coerces missing fields to defaults)
      const parsed = CRMRecordSchema.parse(rawRecord);

      // Business rule: must have email OR mobile
      const hasEmail = parsed.email.trim().length > 0;
      const hasMobile = parsed.mobile_without_country_code.trim().length > 0;

      if (!hasEmail && !hasMobile) {
        skipped.push({
          rowNumber,
          data: rawRecord as Record<string, unknown>,
          reason: 'No email or mobile number provided',
        });
        continue;
      }

      // Normalize crm_status to allowed values
      const statusValues: readonly string[] = ALLOWED_CRM_STATUSES;
      if (parsed.crm_status && !statusValues.includes(parsed.crm_status)) {
        parsed.crm_status = '';
      }

      // Normalize data_source to allowed values
      const sourceValues: readonly string[] = ALLOWED_DATA_SOURCES;
      if (parsed.data_source && !sourceValues.includes(parsed.data_source)) {
        parsed.data_source = '';
      }

      // Ensure created_at has a value
      if (!parsed.created_at || parsed.created_at.trim() === '') {
        parsed.created_at = new Date().toISOString();
      }

      // Strip any unescaped newlines from all string fields
      const cleanedRecord: CRMRecord = {
        created_at: sanitizeField(parsed.created_at),
        name: sanitizeField(parsed.name),
        email: sanitizeField(parsed.email),
        country_code: sanitizeField(parsed.country_code),
        mobile_without_country_code: sanitizeField(parsed.mobile_without_country_code),
        company: sanitizeField(parsed.company),
        city: sanitizeField(parsed.city),
        state: sanitizeField(parsed.state),
        country: sanitizeField(parsed.country),
        lead_owner: sanitizeField(parsed.lead_owner),
        crm_status: sanitizeField(parsed.crm_status) as CRMRecord['crm_status'],
        crm_note: sanitizeField(parsed.crm_note),
        data_source: sanitizeField(parsed.data_source) as CRMRecord['data_source'],
        possession_time: sanitizeField(parsed.possession_time),
        description: sanitizeField(parsed.description),
      };

      valid.push(cleanedRecord);
    } catch (error) {
      skipped.push({
        rowNumber,
        data: rawRecord as Record<string, unknown>,
        reason: `Validation error: ${error instanceof z.ZodError ? error.errors.map((e) => e.message).join(', ') : String(error)}`,
      });
    }
  }

  return { valid, skipped };
}

/**
 * Remove newlines and excessive whitespace from a field value.
 */
function sanitizeField(value: string): string {
  if (!value) return '';
  return value
    .replace(/\r\n/g, ' ')
    .replace(/[\r\n]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
