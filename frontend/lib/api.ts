/**
 * API wrapper functions for communicating with the backend.
 * All requests include the browserId for session isolation.
 */

import type { ImportResponse, PastImportSummary, PastImport } from '@/types/crm';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

/**
 * Get or create a persistent browser ID for session isolation.
 * Stored in localStorage so it persists across page reloads.
 */
export function getBrowserId(): string {
  if (typeof window === 'undefined') return '';

  let browserId = localStorage.getItem('groweasy_browser_id');
  if (!browserId) {
    browserId = crypto.randomUUID();
    localStorage.setItem('groweasy_browser_id', browserId);
  }
  return browserId;
}

/**
 * Submit a CSV file for AI-powered import processing.
 * Sends the file as multipart form data to the backend.
 */
export async function submitCSVForImport(
  file: File,
  onProgress?: (currentBatch: number, totalBatches: number) => void
): Promise<ImportResponse> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('browserId', getBrowserId());

  const response = await fetch(`${BACKEND_URL}/api/import`, {
    method: 'POST',
    body: formData,
    credentials: 'include',
    headers: {
      'x-browser-id': getBrowserId(),
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      error: 'Unknown server error',
    }));
    throw new Error(errorData.error || `Server error: ${response.status}`);
  }

  // Parse SSE Stream
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('Failed to read response stream');
  }

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // Process complete events split by \n\n
    let boundary = buffer.indexOf('\n\n');
    while (boundary !== -1) {
      const chunk = buffer.slice(0, boundary).trim();
      buffer = buffer.slice(boundary + 2);

      if (chunk.startsWith('data: ')) {
        try {
          const data = JSON.parse(chunk.substring(6));

          if (data.type === 'progress' && onProgress) {
            onProgress(data.currentBatch, data.totalBatches);
          } else if (data.type === 'complete') {
            return data as ImportResponse;
          } else if (data.type === 'error') {
            throw new Error(data.message);
          }
        } catch (e) {
          if (e instanceof Error && !e.message.includes('Unexpected end of JSON input')) {
            throw e;
          }
        }
      }

      boundary = buffer.indexOf('\n\n');
    }
  }

  throw new Error('Stream ended without complete event');
}

/**
 * Fetch list of past imports for the current browser.
 */
export async function getImportHistory(): Promise<PastImportSummary[]> {
  const browserId = getBrowserId();

  const response = await fetch(
    `${BACKEND_URL}/api/imports?browserId=${encodeURIComponent(browserId)}`,
    {
      credentials: 'include',
      headers: {
        'x-browser-id': browserId,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch import history');
  }

  const data = await response.json();
  return data.imports;
}

/**
 * Fetch full details of a specific past import.
 */
export async function getImportDetail(id: string): Promise<PastImport> {
  const browserId = getBrowserId();

  const response = await fetch(
    `${BACKEND_URL}/api/imports/${id}?browserId=${encodeURIComponent(browserId)}`,
    {
      credentials: 'include',
      headers: {
        'x-browser-id': browserId,
      },
    }
  );

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Import not found');
    }
    if (response.status === 403) {
      throw new Error('Access denied');
    }
    throw new Error('Failed to fetch import details');
  }

  return response.json();
}
