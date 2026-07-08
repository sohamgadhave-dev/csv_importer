"use client";

import { useCallback, useState } from "react";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  isDisabled?: boolean;
}

/**
 * Drag & drop file upload zone with visual feedback.
 * Accepts only .csv files, validates size (10MB max).
 */
export default function FileUpload({
  onFileSelect,
  isDisabled = false,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateAndSelect = useCallback(
    (file: File) => {
      setError(null);

      if (!file.name.toLowerCase().endsWith(".csv")) {
        setError("Please select a CSV file");
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        setError("File size exceeds 10MB limit");
        return;
      }

      if (file.size === 0) {
        setError("File is empty");
        return;
      }

      onFileSelect(file);
    },
    [onFileSelect]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!isDisabled) setIsDragging(true);
    },
    [isDisabled]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      if (isDisabled) return;

      const file = e.dataTransfer.files[0];
      if (file) validateAndSelect(file);
    },
    [isDisabled, validateAndSelect]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) validateAndSelect(file);
      // Reset input so the same file can be re-selected
      e.target.value = "";
    },
    [validateAndSelect]
  );

  return (
    <div className="animate-fade-in">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`group relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-16 text-center transition-all duration-300 ${
          isDisabled
            ? "cursor-not-allowed border-surface-200 bg-surface-50 opacity-50 dark:border-surface-700 dark:bg-surface-800/50"
            : isDragging
              ? "border-brand-400 bg-brand-50/50 shadow-glow dark:border-brand-500 dark:bg-brand-900/20"
              : "cursor-pointer border-surface-300 bg-white hover:border-brand-400 hover:bg-brand-50/30 hover:shadow-lg dark:border-surface-600 dark:bg-surface-800/30 dark:hover:border-brand-500 dark:hover:bg-brand-900/10"
        }`}
      >
        {/* Animated icon */}
        <div
          className={`mb-6 flex h-20 w-20 items-center justify-center rounded-2xl transition-all duration-300 ${
            isDragging
              ? "scale-110 bg-brand-100 dark:bg-brand-900/30"
              : "bg-surface-100 group-hover:scale-105 group-hover:bg-brand-100 dark:bg-surface-800 dark:group-hover:bg-brand-900/30"
          }`}
        >
          <svg
            className={`h-10 w-10 transition-colors duration-300 ${
              isDragging
                ? "text-brand-500"
                : "text-surface-400 group-hover:text-brand-500 dark:text-surface-500"
            }`}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
            />
          </svg>
        </div>

        {/* Text */}
        <h3 className="mb-2 text-lg font-semibold text-surface-800 dark:text-surface-200">
          {isDragging ? "Drop your CSV here" : "Upload your CSV file"}
        </h3>
        <p className="mb-4 text-sm text-surface-500 dark:text-surface-400">
          Drag & drop your file here, or{" "}
          <span className="font-medium text-brand-600 dark:text-brand-400">
            click to browse
          </span>
        </p>
        <p className="text-xs text-surface-400 dark:text-surface-500">
          CSV files only • Max 10MB
        </p>

        {/* Hidden file input */}
        <input
          type="file"
          accept=".csv"
          onChange={handleFileInput}
          disabled={isDisabled}
          className="absolute inset-0 cursor-pointer opacity-0"
          id="csv-file-input"
          aria-label="Upload CSV file"
        />
      </div>

      {/* Error message */}
      {error && (
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 animate-slide-down dark:bg-red-900/20 dark:text-red-400">
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
    </div>
  );
}
