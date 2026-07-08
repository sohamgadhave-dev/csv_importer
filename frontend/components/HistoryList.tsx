"use client";

import type { PastImportSummary } from "@/types/crm";

interface HistoryListProps {
  imports: PastImportSummary[];
  onViewDetails: (id: string) => void;
  isLoading?: boolean;
}

/**
 * Card-based list of past imports with stats and view details action.
 */
export default function HistoryList({
  imports,
  onViewDetails,
  isLoading = false,
}: HistoryListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="animate-pulse rounded-2xl border border-surface-200 bg-white p-6 dark:border-surface-700 dark:bg-surface-800"
          >
            <div className="mb-3 h-5 w-48 rounded bg-surface-200 dark:bg-surface-700" />
            <div className="mb-2 h-4 w-32 rounded bg-surface-100 dark:bg-surface-700/50" />
            <div className="h-4 w-24 rounded bg-surface-100 dark:bg-surface-700/50" />
          </div>
        ))}
      </div>
    );
  }

  if (imports.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-surface-200 py-16 dark:border-surface-700">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-100 dark:bg-surface-800">
          <svg
            className="h-8 w-8 text-surface-400"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m6 4.125l2.25 2.25m0 0l2.25 2.25M12 13.875l2.25-2.25M12 13.875l-2.25 2.25M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
            />
          </svg>
        </div>
        <h3 className="mb-1 text-lg font-semibold text-surface-700 dark:text-surface-300">
          No imports yet
        </h3>
        <p className="text-sm text-surface-500 dark:text-surface-400">
          Your past imports will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {imports.map((imp, idx) => (
        <div
          key={imp._id}
          className="group rounded-2xl border border-surface-200 bg-white p-6 transition-all duration-300 hover:border-brand-200 hover:shadow-lg hover:-translate-y-0.5 dark:border-surface-700 dark:bg-surface-800/50 dark:hover:border-brand-800 animate-slide-up"
          style={{ animationDelay: `${idx * 80}ms` }}
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              {/* File icon */}
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 transition-colors group-hover:bg-brand-100 dark:bg-brand-900/20 dark:group-hover:bg-brand-900/30">
                <svg
                  className="h-6 w-6 text-brand-600 dark:text-brand-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                  />
                </svg>
              </div>

              {/* Info */}
              <div>
                <h3 className="font-semibold text-surface-800 dark:text-surface-200">
                  {imp.originalFilename}
                </h3>
                <p className="mt-1 text-xs text-surface-400 dark:text-surface-500">
                  {new Date(imp.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
                <div className="mt-2 flex gap-3">
                  <span className="badge badge-success">
                    ✓ {imp.totalImported} imported
                  </span>
                  {imp.totalSkipped > 0 && (
                    <span className="badge badge-danger">
                      ✕ {imp.totalSkipped} skipped
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* View button */}
            <button
              onClick={() => onViewDetails(imp._id)}
              className="btn-ghost"
              id={`view-import-${imp._id}`}
            >
              View Details
              <svg
                className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8.25 4.5l7.5 7.5-7.5 7.5"
                />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
