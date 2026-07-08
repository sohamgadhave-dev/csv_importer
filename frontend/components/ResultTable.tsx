import { useState, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { CRMRecord, SkippedRecord } from "@/types/crm";
import { CRM_FIELDS, CRM_FIELD_LABELS } from "@/types/crm";

interface ResultTableProps {
  importedRecords: CRMRecord[];
  skippedRecords: SkippedRecord[];
}

/**
 * Result table showing imported and skipped records in tab view.
 * Features color-coded rows, download as CSV, and virtualization for 10,000+ rows.
 */
export default function ResultTable({
  importedRecords,
  skippedRecords,
}: ResultTableProps) {
  const [activeTab, setActiveTab] = useState<"imported" | "skipped">("imported");

  const importedParentRef = useRef<HTMLDivElement>(null);
  const skippedParentRef = useRef<HTMLDivElement>(null);

  const importedVirtualizer = useVirtualizer({
    count: importedRecords.length,
    getScrollElement: () => importedParentRef.current,
    estimateSize: () => 45,
    overscan: 5,
  });

  const skippedVirtualizer = useVirtualizer({
    count: skippedRecords.length,
    getScrollElement: () => skippedParentRef.current,
    estimateSize: () => 45,
    overscan: 5,
  });

  const importedVirtualItems = importedVirtualizer.getVirtualItems();
  const skippedVirtualItems = skippedVirtualizer.getVirtualItems();

  const handleDownloadCSV = () => {
    if (importedRecords.length === 0) return;

    const headers = CRM_FIELDS.map((f) => CRM_FIELD_LABELS[f]);
    const csvRows = importedRecords.map((record) =>
      CRM_FIELDS.map((field) => {
        const value = record[field] || "";
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
        <div 
          ref={importedParentRef}
          className="table-container"
          style={{ maxHeight: "500px", overflow: "auto" }}
        >
          {importedRecords.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-surface-400">
              No records were imported
            </div>
          ) : (
            <table style={{ borderCollapse: "separate", borderSpacing: 0 }}>
              <thead style={{ position: "sticky", top: 0, zIndex: 10 }}>
                <tr>
                  <th className="w-12 text-center bg-surface-50 dark:bg-surface-800 border-b border-surface-200 dark:border-surface-700">#</th>
                  {CRM_FIELDS.map((field) => (
                    <th key={field} className="bg-surface-50 dark:bg-surface-800 border-b border-surface-200 dark:border-surface-700">{CRM_FIELD_LABELS[field]}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {importedVirtualItems.length > 0 && (
                  <tr style={{ height: `${importedVirtualItems[0].start}px` }} />
                )}

                {importedVirtualItems.map((virtualRow) => {
                  const record = importedRecords[virtualRow.index];
                  return (
                    <tr
                      key={virtualRow.key}
                      className="row-imported"
                      data-index={virtualRow.index}
                      ref={importedVirtualizer.measureElement}
                    >
                      <td className="text-center text-xs text-surface-400">
                        {virtualRow.index + 1}
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
                  );
                })}

                {importedVirtualItems.length > 0 && (
                  <tr
                    style={{
                      height: `${
                        importedVirtualizer.getTotalSize() -
                        importedVirtualItems[importedVirtualItems.length - 1].end
                      }px`,
                    }}
                  />
                )}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Skipped Records Table */}
      {activeTab === "skipped" && (
        <div 
          ref={skippedParentRef}
          className="table-container"
          style={{ maxHeight: "500px", overflow: "auto" }}
        >
          {skippedRecords.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-surface-400">
              No records were skipped — perfect import! 🎉
            </div>
          ) : (
            <table style={{ borderCollapse: "separate", borderSpacing: 0 }}>
              <thead style={{ position: "sticky", top: 0, zIndex: 10 }}>
                <tr>
                  <th className="w-16 bg-surface-50 dark:bg-surface-800 border-b border-surface-200 dark:border-surface-700">Row #</th>
                  <th className="bg-surface-50 dark:bg-surface-800 border-b border-surface-200 dark:border-surface-700">Skip Reason</th>
                  <th className="bg-surface-50 dark:bg-surface-800 border-b border-surface-200 dark:border-surface-700">Raw Data</th>
                </tr>
              </thead>
              <tbody>
                {skippedVirtualItems.length > 0 && (
                  <tr style={{ height: `${skippedVirtualItems[0].start}px` }} />
                )}

                {skippedVirtualItems.map((virtualRow) => {
                  const record = skippedRecords[virtualRow.index];
                  return (
                    <tr
                      key={virtualRow.key}
                      className="row-skipped"
                      data-index={virtualRow.index}
                      ref={skippedVirtualizer.measureElement}
                    >
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
                  );
                })}

                {skippedVirtualItems.length > 0 && (
                  <tr
                    style={{
                      height: `${
                        skippedVirtualizer.getTotalSize() -
                        skippedVirtualItems[skippedVirtualItems.length - 1].end
                      }px`,
                    }}
                  />
                )}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
