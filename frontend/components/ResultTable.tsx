"use client";

import { useState } from "react";
import type { CRMRecord, SkippedRecord } from "@/types/crm";
import { CRM_FIELDS, CRM_FIELD_LABELS } from "@/types/crm";

interface ResultTableProps {
  importedRecords: CRMRecord[];
  skippedRecords: SkippedRecord[];
}

/**
 * Result table showing imported and skipped records in tab view.
 * Features color-coded rows, download as CSV, and skip reason display.
 */
export default function ResultTable({
  importedRecords,
  skippedRecords,
}: ResultTableProps) {
  const [activeTab, setActiveTab] = useState<"imported" | "skipped">(
    "imported"
  );

  const handleDownloadCSV = () => {
    if (importedRecords.length === 0) return;

    const headers = CRM_FIELDS.map((f) => CRM_FIELD_LABELS[f]);
    const csvRows = importedRecords.map((record) =>
      CRM_FIELDS.map((field) => {
        const value = record[field] || "";
        // Escape quotes and wrap in quotes if contains comma or quote
        const escaped = String(value).replace(/"/g, '""');
        return `"${escaped}"`;
      }).join(",")
    );

    const csvContent = [headers.join(","), ...csvRows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `crm_import_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="animate-slide-up space-y-4">
      {/* Tabs + Download */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex rounded-xl bg-surface-100 p-1 dark:bg-surface-800">
          <button
            onClick={() => setActiveTab("imported")}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              activeTab === "imported"
                ? "bg-white text-brand-700 shadow-sm dark:bg-surface-700 dark:text-brand-400"
                : "text-surface-500 hover:text-surface-700 dark:text-surface-400 dark:hover:text-surface-200"
            }`}
            id="tab-imported"
          >
            <span className="text-green-500">✓</span>
            Imported ({importedRecords.length})
          </button>
          <button
            onClick={() => setActiveTab("skipped")}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              activeTab === "skipped"
                ? "bg-white text-red-700 shadow-sm dark:bg-surface-700 dark:text-red-400"
                : "text-surface-500 hover:text-surface-700 dark:text-surface-400 dark:hover:text-surface-200"
            }`}
            id="tab-skipped"
          >
            <span className="text-red-500">✕</span>
            Skipped ({skippedRecords.length})
          </button>
        </div>

        {activeTab === "imported" && importedRecords.length > 0 && (
          <button
            onClick={handleDownloadCSV}
            className="btn-secondary text-sm"
            id="download-csv-btn"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
              />
            </svg>
            Download CSV
          </button>
        )}
      </div>

      {/* Imported Records Table */}
      {activeTab === "imported" && (
        <div className="table-container">
          {importedRecords.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-surface-400">
              No records were imported
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th className="w-12 text-center">#</th>
                  {CRM_FIELDS.map((field) => (
                    <th key={field}>{CRM_FIELD_LABELS[field]}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {importedRecords.map((record, idx) => (
                  <tr key={idx} className="row-imported">
                    <td className="text-center text-xs text-surface-400">
                      {idx + 1}
                    </td>
                    {CRM_FIELDS.map((field) => (
                      <td key={field}>
                        <span className="max-w-[200px] truncate block">
                          {field === "crm_status" && record[field] ? (
                            <span
                              className={`badge ${
                                record[field] === "SALE_DONE"
                                  ? "badge-success"
                                  : record[field] === "BAD_LEAD"
                                    ? "badge-danger"
                                    : record[field] === "GOOD_LEAD_FOLLOW_UP"
                                      ? "badge-info"
                                      : "badge-warning"
                              }`}
                            >
                              {record[field]}
                            </span>
                          ) : (
                            record[field] || "—"
                          )}
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Skipped Records Table */}
      {activeTab === "skipped" && (
        <div className="table-container">
          {skippedRecords.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-surface-400">
              No records were skipped — perfect import! 🎉
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th className="w-16">Row #</th>
                  <th>Skip Reason</th>
                  <th>Raw Data</th>
                </tr>
              </thead>
              <tbody>
                {skippedRecords.map((record, idx) => (
                  <tr key={idx} className="row-skipped">
                    <td className="font-medium">{record.rowNumber}</td>
                    <td>
                      <span className="badge badge-danger">
                        {record.reason}
                      </span>
                    </td>
                    <td>
                      <span className="max-w-[400px] truncate block text-xs text-surface-500 dark:text-surface-400">
                        {JSON.stringify(record.data).slice(0, 150)}
                        {JSON.stringify(record.data).length > 150 && "..."}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
