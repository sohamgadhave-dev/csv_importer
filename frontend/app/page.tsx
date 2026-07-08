"use client";

import { useState, useCallback } from "react";
import FileUpload from "@/components/FileUpload";
import PreviewTable from "@/components/PreviewTable";
import ResultTable from "@/components/ResultTable";
import StatsBar from "@/components/StatsBar";
import LoadingState from "@/components/LoadingState";
import { parseCSVFile } from "@/lib/csvParser";
import { submitCSVForImport } from "@/lib/api";
import type { CRMRecord, SkippedRecord } from "@/types/crm";

/** Application state machine for the import flow */
type ImportStep = "upload" | "preview" | "processing" | "results" | "error";

/**
 * Main import flow page — 5-step wizard:
 * 1. FileUpload → 2. PreviewTable → 3. Loading → 4. Results → 5. Error (fallback)
 */
export default function ImportPage() {
  const [step, setStep] = useState<ImportStep>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [importedRecords, setImportedRecords] = useState<CRMRecord[]>([]);
  const [skippedRecords, setSkippedRecords] = useState<SkippedRecord[]>([]);
  const [totalImported, setTotalImported] = useState(0);
  const [totalSkipped, setTotalSkipped] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentBatch, setCurrentBatch] = useState<number | undefined>(undefined);
  const [totalBatches, setTotalBatches] = useState<number | undefined>(undefined);

  /**
   * Handle file selection — parse CSV locally and show preview.
   */
  const handleFileSelect = useCallback(async (selectedFile: File) => {
    try {
      setFile(selectedFile);
      setErrorMessage("");

      const { rows: parsedRows, columns: parsedColumns } =
        await parseCSVFile(selectedFile);

      setRows(parsedRows);
      setColumns(parsedColumns);
      setStep("preview");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to parse CSV file"
      );
      setStep("error");
    }
  }, []);

  /**
   * Handle import confirmation — send to backend for AI processing.
   */
  const handleConfirmImport = useCallback(async () => {
    if (!file) return;

    try {
      setIsLoading(true);
      setStep("processing");
      setErrorMessage("");

      const response = await submitCSVForImport(file, (current, total) => {
        setCurrentBatch(current);
        setTotalBatches(total);
      });

      setImportedRecords(response.importedRecords);
      setSkippedRecords(response.skippedRecords);
      setTotalImported(response.totalImported);
      setTotalSkipped(response.totalSkipped);
      setStep("results");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Import failed"
      );
      setStep("error");
    } finally {
      setIsLoading(false);
    }
  }, [file]);

  /**
   * Reset the entire flow to start over.
   */
  const handleReset = useCallback(() => {
    setStep("upload");
    setFile(null);
    setRows([]);
    setColumns([]);
    setImportedRecords([]);
    setSkippedRecords([]);
    setTotalImported(0);
    setTotalSkipped(0);
    setErrorMessage("");
    setIsLoading(false);
    setCurrentBatch(undefined);
    setTotalBatches(undefined);
  }, []);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="text-center animate-fade-in">
        <h1 className="text-3xl font-bold text-surface-900 sm:text-4xl dark:text-white">
          AI-Powered CSV Import
        </h1>
        <p className="mt-3 text-base text-surface-500 dark:text-surface-400 max-w-2xl mx-auto">
          Upload any CSV file and our AI will intelligently map your columns to
          the CRM schema, validate data, and produce clean records.
        </p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-2 animate-fade-in">
        {[
          { key: "upload", label: "Upload", num: "1" },
          { key: "preview", label: "Preview", num: "2" },
          { key: "processing", label: "Process", num: "3" },
          { key: "results", label: "Results", num: "4" },
        ].map((s, idx) => {
          const stepOrder = ["upload", "preview", "processing", "results"];
          const currentIdx = stepOrder.indexOf(step === "error" ? "upload" : step);
          const thisIdx = idx;
          const isActive = thisIdx === currentIdx;
          const isDone = thisIdx < currentIdx;

          return (
            <div key={s.key} className="flex items-center gap-2">
              {idx > 0 && (
                <div
                  className={`h-px w-8 sm:w-12 transition-colors duration-300 ${
                    isDone ? "bg-brand-400" : "bg-surface-200 dark:bg-surface-700"
                  }`}
                />
              )}
              <div className="flex items-center gap-2">
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 ${
                    isActive
                      ? "bg-brand-500 text-white shadow-lg shadow-brand-500/30"
                      : isDone
                        ? "bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400"
                        : "bg-surface-100 text-surface-400 dark:bg-surface-800 dark:text-surface-500"
                  }`}
                >
                  {isDone ? "✓" : s.num}
                </div>
                <span
                  className={`hidden text-xs font-medium sm:inline ${
                    isActive
                      ? "text-brand-700 dark:text-brand-400"
                      : isDone
                        ? "text-surface-600 dark:text-surface-400"
                        : "text-surface-400 dark:text-surface-500"
                  }`}
                >
                  {s.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* File Info Bar (when file is selected) */}
      {file && step !== "upload" && (
        <div className="flex items-center justify-between rounded-xl border border-surface-200 bg-white px-5 py-3 dark:border-surface-700 dark:bg-surface-800/50 animate-slide-down">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-900/20">
              <svg
                className="h-5 w-5 text-brand-600 dark:text-brand-400"
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
            <div>
              <p className="text-sm font-medium text-surface-800 dark:text-surface-200">
                {file.name}
              </p>
              <p className="text-xs text-surface-400">
                {(file.size / 1024).toFixed(1)} KB • {rows.length} rows
              </p>
            </div>
          </div>
          {step !== "processing" && (
            <button
              onClick={handleReset}
              className="btn-ghost text-xs"
              id="new-import-btn"
            >
              New Import
            </button>
          )}
        </div>
      )}

      {/* ── Step Content ────────────────────────────────────────── */}

      {/* Step 1: Upload */}
      {step === "upload" && <FileUpload onFileSelect={handleFileSelect} />}

      {/* Step 2: Preview */}
      {step === "preview" && (
        <PreviewTable
          rows={rows}
          columns={columns}
          onConfirm={handleConfirmImport}
          isLoading={isLoading}
        />
      )}

      {/* Step 3: Processing */}
      {step === "processing" && (
        <LoadingState 
          totalRows={rows.length}
          currentBatch={currentBatch} 
          totalBatches={totalBatches} 
        />
      )}

      {/* Step 4: Results */}
      {step === "results" && (
        <div className="space-y-6">
          <StatsBar
            totalImported={totalImported}
            totalSkipped={totalSkipped}
          />
          <ResultTable
            importedRecords={importedRecords}
            skippedRecords={skippedRecords}
          />
        </div>
      )}

      {/* Error State */}
      {step === "error" && (
        <div className="flex flex-col items-center justify-center py-12 animate-scale-in">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 dark:bg-red-900/20">
            <svg
              className="h-8 w-8 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
          </div>
          <h3 className="mb-2 text-lg font-semibold text-surface-800 dark:text-surface-200">
            Something went wrong
          </h3>
          <p className="mb-6 max-w-md text-center text-sm text-surface-500 dark:text-surface-400">
            {errorMessage}
          </p>
          <div className="flex gap-3">
            <button onClick={handleReset} className="btn-primary">
              Try Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
