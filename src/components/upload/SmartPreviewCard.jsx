// frontend/src/components/upload/SmartPreviewCard.jsx
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, AlertCircle, FileText, Database } from "lucide-react";
import PreviewTable from "@/components/analyzer/PreviewTable.jsx";

export default function SmartPreviewCard({ report, onConfirm }) {
  if (!report) return null;

  const isTabular = report.file_type === "tabular";
  const scrutiny = report.scrutiny || {};

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
                {report.file_name}
              </h2>
              <p className="text-sm text-blue-100">
                {report.file_type === "tabular"
                  ? `Detected ${report.columns_estimate} columns, ${report.rows_estimate} rows`
                  : "Document file detected — AI content analysis coming soon"}
              </p>
            </div>
          </div>
          <div className="text-xs text-blue-50">
            ID: {report.upload_id.slice(0, 8)}...
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          {/* Info Summary */}
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-800 mb-2">
              Scrutiny Summary
            </h3>

            {isTabular ? (
              <ul className="text-sm text-gray-600 list-disc pl-5 space-y-1">
                {scrutiny?.suggestions?.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-600">
                {scrutiny?.summary ||
                  "Document preview not yet supported. AI document analysis will be available in next release."}
              </p>
            )}
          </div>

          {/* Table Preview */}
          {isTabular && scrutiny?.preview && (
            <div className="border rounded-lg mb-4">
              <PreviewTable
                headers={scrutiny.preview.columns}
                rows={scrutiny.preview.sample.map((r) =>
                  Object.fromEntries(
                    scrutiny.preview.columns.map((h, i) => [h, r[i]])
                  )
                )}
                maxHeight="300px"
              />
            </div>
          )}

          {/* Confidence Meter */}
          {isTabular && (
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-800 mb-1">
                Header Confidence
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {scrutiny.headers_confidence?.slice(0, 6)?.map((h, i) => (
                  <div
                    key={i}
                    className="p-2 border rounded-lg bg-gray-50 flex justify-between text-xs text-gray-700"
                  >
                    <span className="truncate max-w-[120px]" title={h.header}>
                      {h.header}
                    </span>
                    <span
                      className={`font-semibold ${
                        h.confidence > 0.8
                          ? "text-green-600"
                          : h.confidence > 0.5
                          ? "text-yellow-600"
                          : "text-red-600"
                      }`}
                    >
                      {(h.confidence * 100).toFixed(0)}%
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
                  ? "Ready for AI-powered analysis"
                  : "Document parsing coming soon"}
              </span>
            </div>

            {isTabular && (
              <button
                onClick={() => onConfirm(report)}
                className="px-5 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold hover:opacity-90 shadow-md transition"
              >
                Confirm & Analyze →
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
