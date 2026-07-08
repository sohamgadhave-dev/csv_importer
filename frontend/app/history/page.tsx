"use client";

import { useState, useEffect, useCallback } from "react";
import HistoryList from "@/components/HistoryList";
import ResultTable from "@/components/ResultTable";
import StatsBar from "@/components/StatsBar";
import { getImportHistory, getImportDetail } from "@/lib/api";
import type { PastImportSummary, PastImport } from "@/types/crm";

/**
 * History page — shows past imports with ability to view full details.
 */
export default function HistoryPage() {
  const [imports, setImports] = useState<PastImportSummary[]>([]);
  const [selectedImport, setSelectedImport] = useState<PastImport | null>(null);
  const [isListLoading, setIsListLoading] = useState(true);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [error, setError] = useState<string>("");

  // Fetch import history on mount
  useEffect(() => {
    async function fetchHistory() {
      try {
        setIsListLoading(true);
        const data = await getImportHistory();
        setImports(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load history"
        );
      } finally {
        setIsListLoading(false);
      }
    }
    fetchHistory();
  }, []);

  // View import details
  const handleViewDetails = useCallback(async (id: string) => {
    try {
      setIsDetailLoading(true);
      setError("");
      const data = await getImportDetail(id);
      setSelectedImport(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load import details"
      );
    } finally {
      setIsDetailLoading(false);
    }
  }, []);

  // Go back to list
  const handleBackToList = useCallback(() => {
    setSelectedImport(null);
  }, []);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="animate-fade-in">
        <div className="flex items-center gap-3">
          {selectedImport && (
            <button
              onClick={handleBackToList}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-surface-500 transition-all hover:bg-surface-100 dark:text-surface-400 dark:hover:bg-surface-800"
              id="back-to-list-btn"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 19.5L8.25 12l7.5-7.5"
                />
              </svg>
            </button>
          )}
          <div>
            <h1 className="text-3xl font-bold text-surface-900 dark:text-white">
              {selectedImport ? selectedImport.originalFilename : "Import History"}
            </h1>
            <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
              {selectedImport
                ? `Imported on ${new Date(selectedImport.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}`
                : "View and manage your past CSV imports"}
            </p>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 animate-slide-down dark:bg-red-900/20 dark:text-red-400">
          <svg
            className="h-5 w-5 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          {error}
        </div>
      )}

      {/* Detail View */}
      {selectedImport && !isDetailLoading && (
        <div className="space-y-6 animate-slide-up">
          <StatsBar
            totalImported={selectedImport.totalImported}
            totalSkipped={selectedImport.totalSkipped}
          />
          <ResultTable
            importedRecords={selectedImport.crmRecords}
            skippedRecords={selectedImport.skippedRecords || []}
          />
        </div>
      )}

      {/* Detail Loading */}
      {isDetailLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-4">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-surface-200 border-t-brand-500 dark:border-surface-700" />
            <p className="text-sm text-surface-500">Loading import details...</p>
          </div>
        </div>
      )}

      {/* List View */}
      {!selectedImport && !isDetailLoading && (
        <HistoryList
          imports={imports}
          onViewDetails={handleViewDetails}
          isLoading={isListLoading}
        />
      )}
    </div>
  );
}
