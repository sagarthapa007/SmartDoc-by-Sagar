import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, FileText, Database } from "lucide-react";
import PreviewTable from "@/components/analyzer/PreviewTable.jsx";

export default function SmartPreviewCard({ report, onConfirm }) {
  if (!report) return null;

  // Handle unified shape
  const scrutiny = report.scrutiny || {};
  const fileType = (report.filetype || scrutiny.file_type || "").toLowerCase();
  const isTabular = ["csv", "excel", "json", "xlsx", "xls"].some((t) =>
    fileType.includes(t),
  );

  const suggestions = scrutiny.suggestions || [];
  const preview = scrutiny.preview || [];
  const schema = scrutiny.schema || [];
  const rows = scrutiny.rows_detected || 0;
  const cols = scrutiny.columns_detected || 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.3 }}
        className="bg-white border border-gray-200 rounded-2xl shadow-lg overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isTabular ? (
              <Database className="w-5 h-5 text-white/90" />
            ) : (
              <FileText className="w-5 h-5 text-white/90" />
            )}
            <div>
              <h2 className="text-lg font-semibold truncate">
                {report.filename || "Untitled File"}
              </h2>
              <p className="text-sm text-blue-100">
                {isTabular
                  ? `Detected ${cols} columns • ${rows} rows`
                  : `${fileType.toUpperCase()} document detected`}
              </p>
            </div>
          </div>
          <div className="text-xs text-blue-50">
            ID: {report.upload_id?.slice(0, 10) || "N/A"}
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          {/* Summary / Suggestions */}
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-800 mb-2">
              Scrutiny Summary
            </h3>

            {isTabular ? (
              <ul className="text-sm text-gray-600 list-disc pl-5 space-y-1">
                {suggestions.length ? (
                  suggestions.map((s, i) => <li key={i}>{s}</li>)
                ) : (
                  <li>No issues detected — ready for AI analysis.</li>
                )}
              </ul>
            ) : (
              <p className="text-sm text-gray-600">
                {scrutiny.summary_excerpt ||
                  "Document ready for semantic analysis. Insights will be generated next."}
              </p>
            )}
          </div>

          {/* Table Preview */}
          {isTabular && preview.length > 0 && (
            <div className="border rounded-lg mb-4 overflow-x-auto">
              <PreviewTable
                headers={Object.keys(preview[0])}
                rows={preview}
                maxHeight="300px"
              />
            </div>
          )}

          {/* Schema Overview */}
          {isTabular && schema.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-800 mb-1">
                Column Type Overview
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {schema.slice(0, 6).map((col, i) => (
                  <div
                    key={i}
                    className="p-2 border rounded-lg bg-gray-50 text-xs text-gray-700 flex justify-between"
                  >
                    <span className="truncate max-w-[120px]" title={col.name}>
                      {col.name}
                    </span>
                    <span className="text-blue-600 font-semibold">
                      {col.type}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Call to Action */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-6">
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>
                {isTabular
                  ? "Dataset is ready for AI-powered analysis"
                  : "Document queued for semantic AI analysis"}
              </span>
            </div>

            <button
              onClick={() => onConfirm(report)}
              className="px-5 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold hover:opacity-90 shadow-md transition"
            >
              Confirm & Analyze →
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
