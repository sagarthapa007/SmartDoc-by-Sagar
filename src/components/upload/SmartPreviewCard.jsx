import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, FileText, Database, AlertTriangle, Layers } from "lucide-react";
import PreviewTable from "@/components/analyzer/PreviewTable.jsx";

export default function SmartPreviewCard({ report, onConfirm }) {
  if (!report) return null;

  // Handle unified shape with enhanced intelligence
  const scrutiny = report.scrutiny || {};
  const fileType = (report.filetype || scrutiny.file_type || "").toLowerCase();
  const isTabular = ["csv", "excel", "json", "xlsx", "xls"].some((t) =>
    fileType.includes(t),
  );

  // Enhanced data extraction
  const suggestions = scrutiny.suggestions || [];
  const preview = scrutiny.preview || [];
  const schema = scrutiny.schema || [];
  const rows = scrutiny.rows_detected || 0;
  const cols = scrutiny.columns_detected || 0;
  
  // Intelligent header data
  const headers = scrutiny.headers || [];
  const headerIntelligence = scrutiny.header_intelligence || {};
  const hasMultiRowHeaders = headerIntelligence.multirow_detected;
  const headerConfidence = headerIntelligence.header_confidence || 0;
  const mergedCellPatterns = headerIntelligence.merged_cell_patterns || {};
  
  // Determine the best headers to display
  const displayHeaders = headers.length > 0 ? headers : 
                        preview.length > 0 ? Object.keys(preview[0]) : [];

  // Header quality indicators
  const hasHeaderIssues = headerConfidence < 0.7 || 
                         mergedCellPatterns.empty_clusters?.length > 0;

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
          {/* Header Intelligence Status */}
          {isTabular && (
            <div className="mb-4 p-3 border rounded-lg bg-blue-50">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  Header Detection
                </h3>
                <div className={`text-xs px-2 py-1 rounded-full ${
                  headerConfidence > 0.8 ? 'bg-green-100 text-green-800' :
                  headerConfidence > 0.6 ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {Math.round(headerConfidence * 100)}% Confidence
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                {hasMultiRowHeaders && (
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full flex items-center gap-1">
                    <Layers className="w-3 h-3" />
                    Multi-row Headers
                  </span>
                )}
                
                {mergedCellPatterns.empty_clusters?.length > 0 && (
                  <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Merged Cell Patterns
                  </span>
                )}
                
                {headers.length === 0 && (
                  <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full">
                    Auto-generated Headers
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Summary / Suggestions */}
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-800 mb-2">
              Scrutiny Summary
            </h3>

            {isTabular ? (
              <ul className="text-sm text-gray-600 list-disc pl-5 space-y-1">
                {hasHeaderIssues && (
                  <li className="text-orange-600 font-medium">
                    Review column headers for accuracy
                  </li>
                )}
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
              <div className="p-3 bg-gray-50 border-b">
                <h4 className="text-sm font-semibold text-gray-700">
                  Data Preview {hasMultiRowHeaders && "(Multi-row Headers)"}
                </h4>
              </div>

            <PreviewTable
              headers={displayHeaders}
              rows={preview}
              maxHeight="300px"
              headerIntelligence={headerIntelligence}
              showHeaderQuality={hasHeaderIssues}
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
                    <span className={`font-semibold ${
                      col.type === 'string' ? 'text-gray-600' :
                      col.type === 'number' ? 'text-blue-600' :
                      col.type === 'datetime' ? 'text-purple-600' :
                      col.type === 'boolean' ? 'text-green-600' :
                      'text-orange-600'
                    }`}>
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