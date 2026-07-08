"use client";

import { useEffect, useState } from "react";

interface LoadingStateProps {
  totalRows?: number;
  currentBatch?: number;
  totalBatches?: number;
  percentage?: number;
  timeRemaining?: number;
}

/**
 * Professional Loading state displayed while AI processes the CSV.
 * Shows animated progress bar, batch progress, row count, and time remaining.
 */
export default function LoadingState({
  totalRows = 0,
  currentBatch = 0,
  totalBatches = 0,
  percentage: externalPercentage,
  timeRemaining: externalTimeRemaining,
}: LoadingStateProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Track elapsed time to estimate remaining time
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Calculate progress
  const calculatedPercentage =
    totalBatches > 0 ? Math.round((currentBatch / totalBatches) * 100) : 0;
  
  const percentage = externalPercentage !== undefined ? externalPercentage : calculatedPercentage;

  // Estimate time remaining if not provided
  let timeRemaining = externalTimeRemaining;
  if (timeRemaining === undefined) {
    if (currentBatch > 0 && currentBatch < totalBatches) {
      const secondsPerBatch = elapsedSeconds / currentBatch;
      const remainingBatches = totalBatches - currentBatch;
      timeRemaining = Math.round(remainingBatches * secondsPerBatch);
    } else if (currentBatch === 0 && totalBatches > 0) {
      // Rough estimate of 3 seconds per batch based on sequential processing limits
      timeRemaining = Math.max(totalBatches * 3 - elapsedSeconds, 0);
    } else {
      timeRemaining = 0;
    }
  }

  // Estimate processed rows
  const processedRows =
    totalRows > 0 ? Math.round((percentage / 100) * totalRows) : 0;

  return (
    <div className="mx-auto w-full max-w-2xl animate-fade-in py-12">
      <div className="overflow-hidden rounded-2xl border border-surface-200 bg-white/50 p-8 shadow-sm backdrop-blur-sm dark:border-surface-700 dark:bg-surface-800/40">
        
        {/* Header Section */}
        <div className="mb-8 flex flex-col items-center justify-center text-center">
          <div className="relative mb-6 flex h-16 w-16 items-center justify-center">
            {/* Animated Spinner Rings */}
            <div className="absolute inset-0 rounded-full border-4 border-surface-100 dark:border-surface-800" />
            <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-brand-500 border-r-brand-400" />
            
            {/* Inner Icon */}
            <svg
              className="h-6 w-6 text-brand-500 animate-pulse-slow"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
              />
            </svg>
          </div>
          
          <h3 className="text-xl font-bold text-surface-900 dark:text-white">
            ⏳ Processing your CSV with AI...
          </h3>

          <div className="mt-4 flex items-center justify-center rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-700 dark:border-amber-900/50 dark:bg-amber-900/20 dark:text-amber-400">
            <svg className="mr-2 h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
            </svg>
            <span><strong>Note:</strong> We are currently using free-tier AI models, so processing large batches may take a little longer.</span>
          </div>
        </div>

        {/* Progress Bar Section */}
        <div className="mb-6 space-y-2">
          <div className="flex justify-between text-sm font-medium">
            <span className="text-surface-700 dark:text-surface-300">Overall Progress</span>
            <span className="text-brand-600 dark:text-brand-400">{percentage}%</span>
          </div>
          
          <div className="relative h-4 overflow-hidden rounded-full bg-surface-100 shadow-inner dark:bg-surface-900">
            {/* Animated Gradient Fill */}
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-700 ease-out"
              style={{ width: `${percentage}%` }}
            >
              {/* Shimmer effect inside the bar */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent shadow-[inset_0_1px_2px_rgba(255,255,255,0.3)] animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-surface-100 bg-surface-50 p-4 text-center dark:border-surface-700/50 dark:bg-surface-800/50">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-surface-500">
              Batch Progress
            </p>
            <p className="text-lg font-bold text-surface-900 dark:text-white">
              {currentBatch > 0 ? currentBatch : 1} <span className="text-sm font-normal text-surface-500">of</span> {totalBatches || '-'}
            </p>
          </div>
          
          <div className="rounded-xl border border-surface-100 bg-surface-50 p-4 text-center dark:border-surface-700/50 dark:bg-surface-800/50">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-surface-500">
              Rows Processed
            </p>
            <p className="text-lg font-bold text-surface-900 dark:text-white">
              {processedRows} <span className="text-sm font-normal text-surface-500">/</span> {totalRows || '-'}
            </p>
          </div>

          <div className="rounded-xl border border-surface-100 bg-surface-50 p-4 text-center dark:border-surface-700/50 dark:bg-surface-800/50">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-surface-500">
              Time Remaining
            </p>
            <p className="text-lg font-bold text-surface-900 dark:text-white">
              {timeRemaining !== undefined && timeRemaining > 0 
                ? `~${timeRemaining}s` 
                : (percentage === 100 ? "Done" : "Calculating...")}
            </p>
          </div>
        </div>

        {/* Footer Message */}
        <div className="mt-8 border-t border-surface-100 pt-6 text-center dark:border-surface-700/50">
          <p className="text-sm text-surface-500 dark:text-surface-400">
            This typically takes 30-45 seconds depending on file size.
          </p>
        </div>
      </div>
    </div>
  );
}
