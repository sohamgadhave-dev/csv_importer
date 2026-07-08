/**
 * AI-powered CRM record extractor using Google Gemini 1.5 Flash
 * with automatic fallback to Groq Llama 3.1 8B.
 *
 * Optimizations:
 * - Provider caching: If Gemini fails, skip it for 60s
 * - Hard timeout: Gemini calls abort after 8 seconds
 * - Compact prompt: Fewer tokens = faster inference
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';
import {
  GEMINI_MODEL,
  GROQ_MODEL,
  GEMINI_MAX_TOKENS,
} from '../config/constants';
import type { CRMRecord } from '../types/crm';

/** Cached flag: once Gemini fails, skip it for remaining batches */
let geminiDisabledUntil = 0;
const GEMINI_COOLDOWN_MS = 60_000;

/** Hard timeout for a single Gemini API call */
const GEMINI_TIMEOUT_MS = 8_000;

/** Compact system prompt — shorter = faster inference */
const SYSTEM_PROMPT = `You are a CRM data extraction AI. Given CSV records as JSON objects with arbitrary column names, extract and return a JSON array of CRM records.

OUTPUT FIELDS (all strings, use "" if unknown):
created_at, name, email, country_code, mobile_without_country_code, company, city, state, country, lead_owner, crm_status, crm_note, data_source, possession_time, description

RULES:
- Map columns intelligently (e.g. "Full Name"→name, "Phone"→mobile_without_country_code, "Email Address"→email)
- SKIP records with NO email AND NO mobile number (don't include them)
- Multiple emails → first in email field, rest appended to crm_note
- Multiple phones → first in mobile field, rest appended to crm_note
- crm_status MUST be one of: GOOD_LEAD_FOLLOW_UP, DID_NOT_CONNECT, BAD_LEAD, SALE_DONE, or ""
- data_source MUST be one of: leads_on_demand, meridian_tower, eden_park, varah_swamy, sarjapur_plots, or ""
- created_at must be parseable by JS new Date(). Use "YYYY-MM-DD HH:MM:SS" format
- Phone: extract digits for mobile, include "+" for country_code
- No newlines in values. All values must be strings. No nulls.
- Return ONLY a JSON array. No markdown, no code fences, no explanation.`;

/**
 * Extract CRM records from a batch of raw CSV rows.
 * Gemini primary → Groq fallback. Provider failures are cached.
 */
export async function extractCRMRecords(
  batch: Record<string, string>[],
  availableColumns: string[]
): Promise<CRMRecord[]> {
  const userPrompt = `Extract CRM records from these ${batch.length} rows. Columns: ${availableColumns.join(', ')}

${JSON.stringify(batch)}`;

  const now = Date.now();
  const geminiAvailable = now > geminiDisabledUntil;

  if (geminiAvailable) {
    try {
      return await extractWithGemini(userPrompt);
    } catch (geminiError) {
      console.warn(
        '⚠️ Gemini failed, disabling for 60s:',
        geminiError instanceof Error ? geminiError.message : String(geminiError)
      );
      geminiDisabledUntil = Date.now() + GEMINI_COOLDOWN_MS;
    }
  } else {
    console.log('⏭️ Skipping Gemini (cooldown), using Groq');
  }

  try {
    return await extractWithGroq(userPrompt);
  } catch (groqError) {
    throw Object.assign(
      new Error(
        `AI processing failed on both Gemini and Groq. Last Groq error: ${
          groqError instanceof Error ? groqError.message : String(groqError)
        }`
      ),
      { statusCode: 502, code: 'AI_PROCESSING_FAILED' }
    );
  }
}

/**
 * Wraps a promise with a hard timeout using AbortController pattern.
 */
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    promise.then(
      (val) => { clearTimeout(timer); resolve(val); },
      (err) => { clearTimeout(timer); reject(err); }
    );
  });
}

async function extractWithGemini(userPrompt: string): Promise<CRMRecord[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set');

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: GEMINI_MODEL,
    generationConfig: {
      maxOutputTokens: GEMINI_MAX_TOKENS,
      temperature: 0.1,
    },
  });

  // Single attempt with hard timeout — no retries (speed over resilience)
  const result = await withTimeout(
    model.generateContent([
      { text: SYSTEM_PROMPT },
      { text: userPrompt },
    ]),
    GEMINI_TIMEOUT_MS,
    'Gemini'
  );

  const text = result.response.text().trim();
  const cleanedText = text
    .replace(/^```(?:json)?\s*\n?/i, '')
    .replace(/\n?```\s*$/i, '')
    .trim();

  const parsed = JSON.parse(cleanedText);
  if (!Array.isArray(parsed)) throw new Error('Gemini response is not a JSON array');
  return parsed as CRMRecord[];
}

async function extractWithGroq(userPrompt: string): Promise<CRMRecord[]> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY is not set');

  const groq = new Groq({ apiKey });

  // Single attempt, no retries — Groq is our last resort, fail fast
  const completion = await groq.chat.completions.create({
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    model: GROQ_MODEL,
    temperature: 0.1,
    max_tokens: GEMINI_MAX_TOKENS,
  });

  const text = completion.choices[0]?.message?.content?.trim() || '[]';
  const cleanedText = text
    .replace(/^```(?:json)?\s*\n?/i, '')
    .replace(/\n?```\s*$/i, '')
    .trim();

  const parsed = JSON.parse(cleanedText);
  if (!Array.isArray(parsed)) throw new Error('Groq response is not a JSON array');
  return parsed as CRMRecord[];
}
