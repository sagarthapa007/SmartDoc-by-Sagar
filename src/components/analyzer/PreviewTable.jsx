import React from "react";
import { Layers, AlertTriangle, HelpCircle } from "lucide-react";

export default function PreviewTable({
  headers = [],
  rows = [],
  maxHeight = "300px",
  headerIntelligence = {},
  showHeaderQuality = false
}) {
  if (!headers.length || !rows.length) {
    return (
      <div className="text-sm text-gray-500 text-center py-6">
        No preview data available.
      </div>
    );
  }

  // Extract intelligence data
  const {
    multirow_detected: hasMultiRowHeaders = false,
    header_confidence: overallConfidence = 1,
    merged_cell_patterns: mergedPatterns = {},
    hierarchical_headers: isHierarchical = false
  } = headerIntelligence;

  // ✅ SMART FIX: Find the correct key mapping with intelligence
  const getRowValue = (row, header, headerIndex) => {
    // Try multiple approaches to find the value:
    
    // 1. Direct key access (works with cleaned headers)
    if (row[header] !== undefined) return row[header];
    
    // 2. Index-based access (works if headers are in same order as original keys)
    const rowKeys = Object.keys(row);
    if (rowKeys[headerIndex] !== undefined) return row[rowKeys[headerIndex]];
    
    // 3. Case-insensitive fuzzy matching
    const lowerHeader = header.toLowerCase();
    const matchingKey = rowKeys.find(key => key.toLowerCase() === lowerHeader);
    if (matchingKey) return row[matchingKey];
    
    // 4. Fallback: try any available value
    return row[rowKeys[0]] || "";
  };

  // Calculate individual column confidence
  const getColumnConfidence = (header, index) => {
    // Simple heuristic: auto-generated headers have lower confidence
    if (header.startsWith('col_') || header.includes('unnamed')) return 0.3;
    if (header.includes(' | ') && isHierarchical) return 0.9; // Hierarchical are usually good
    if (hasMultiRowHeaders) return 0.8;
    return overallConfidence;
  };

  // Check if column has merged cell patterns
  const hasMergedPatterns = (header, index) => {
    const rowKeys = Object.keys(rows[0] || {});
    const originalKey = rowKeys[index] || header;
    return mergedPatterns.empty_clusters?.some(
      cluster => cluster.column === originalKey
    ) || mergedPatterns.repeated_values?.[originalKey];
  };

  // Get header styling based on intelligence
  const getHeaderStyle = (header, index) => {
    const confidence = getColumnConfidence(header, index);
    const hasMerged = hasMergedPatterns(header, index);
    
    let style = "px-3 py-2 font-semibold border-b border-gray-200 ";
    
    if (hasMerged) {
      style += "bg-orange-50 text-orange-800 border-orange-200 ";
    } else if (confidence < 0.5) {
      style += "bg-red-50 text-red-800 border-red-200 ";
    } else if (confidence < 0.8) {
      style += "bg-yellow-50 text-yellow-800 border-yellow-200 ";
    } else {
      style += "bg-gray-100 text-gray-700 ";
    }
    
    if (header.includes(' | ')) {
      style += "italic "; // Hierarchical headers
    }
    
    return style;
  };

  // Get header tooltip content
  const getHeaderTooltip = (header, index) => {
    const confidence = getColumnConfidence(header, index);
    const hasMerged = hasMergedPatterns(header, index);
    
    const tips = [];
    
    if (hasMultiRowHeaders) {
      tips.push("Multi-row header detected");
    }
    
    if (header.includes(' | ')) {
      tips.push("Hierarchical header");
    }
    
    if (hasMerged) {
      tips.push("Merged cell patterns detected");
    }
    
    if (confidence < 0.5) {
      tips.push("Low confidence - auto-generated");
    } else if (confidence < 0.8) {
      tips.push("Medium confidence");
    } else {
      tips.push("High confidence");
    }
    
    return tips.join(" • ");
  };

  // Get status icon for header
  const getStatusIcon = (header, index) => {
    const confidence = getColumnConfidence(header, index);
    const hasMerged = hasMergedPatterns(header, index);
    
    if (hasMerged) {
      return <AlertTriangle className="w-3 h-3 ml-1 inline" />;
    }
    
    if (header.includes(' | ')) {
      return <Layers className="w-3 h-3 ml-1 inline" />;
    }
    
    if (confidence < 0.5) {
      return <HelpCircle className="w-3 h-3 ml-1 inline" />;
    }
    
    return null;
  };

  return (
    <div
      className="overflow-auto border border-gray-200 rounded-lg"
      style={{ maxHeight }}
    >
      <table className="min-w-full text-sm text-left border-collapse">
        <thead className="sticky top-0">
          <tr>
            {headers.map((h, i) => (
              <th
                key={i}
                className={getHeaderStyle(h, i)}
                title={getHeaderTooltip(h, i)}
              >
                <div className="flex items-center justify-between">
                  <span className="truncate max-w-[150px]" title={h}>
                    {h}
                  </span>
                  {getStatusIcon(h, i)}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, 20).map((row, i) => (
            <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
              {headers.map((h, j) => {
                const value = getRowValue(row, h, j);
                const hasMerged = hasMergedPatterns(h, j);
                
                return (
                  <td
                    key={j}
                    className={`px-3 py-1.5 border-b border-gray-100 text-gray-700 truncate max-w-[200px] ${
                      hasMerged ? "bg-orange-25" : ""
                    }`}
                    title={String(value ?? "")}
                  >
                    {String(value ?? "")}
                    {hasMerged && value === "" && (
                      <span className="text-xs text-orange-500 ml-1">[merged]</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      
      {/* Intelligence Summary Footer */}
      {(showHeaderQuality || hasMultiRowHeaders || mergedPatterns.empty_clusters?.length > 0) && (
        <div className="bg-gray-50 border-t border-gray-200 px-3 py-2 text-xs text-gray-600">
          <div className="flex flex-wrap items-center gap-4">
            {hasMultiRowHeaders && (
              <span className="flex items-center gap-1">
                <Layers className="w-3 h-3" />
                Multi-row headers
              </span>
            )}
            {mergedPatterns.empty_clusters?.length > 0 && (
              <span className="flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Merged cells detected
              </span>
            )}
            {overallConfidence < 0.8 && (
              <span className="flex items-center gap-1">
                <HelpCircle className="w-3 h-3" />
                Review headers
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}