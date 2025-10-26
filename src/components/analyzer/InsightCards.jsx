import React from "react";

/**
 * 💡 InsightCards
 * Displays categorized insights (technical, business, quality, etc.)
 * Now enhanced for backend actions (deduplicate, fill_missing, etc.)
 *
 * Props:
 *  - insights: object from backend (/api/analyze)
 *  - variant: "technical" | "business" | "quality"
 *  - compact: boolean (optional)
 *  - onAction: function(actionType, payload) (optional)
 */

export default function InsightCards({
  insights = {},
  variant = "technical",
  compact = false,
  onAction = () => {},
}) {
  const renderInsight = (insight, idx, category) => {
    const { text, action, actionType, potential_impact, severity, preview } =
      insight;

    const colorMap = {
      high: "border-red-400 bg-red-50 text-red-700",
      medium: "border-yellow-400 bg-yellow-50 text-yellow-700",
      info: "border-blue-400 bg-blue-50 text-blue-700",
      success: "border-green-400 bg-green-50 text-green-700",
      default: "border-gray-200 bg-white text-gray-800",
    };

    return (
      <div
        key={`${category}-${idx}`}
        className={`border rounded-lg p-4 shadow-sm hover:shadow-md transition-all ${colorMap[severity] || colorMap.default}`}
      >
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
          <div>
            <p className="text-sm font-medium leading-relaxed">
              {text || "No description provided."}
            </p>
            {potential_impact && (
              <p className="text-xs text-gray-500 mt-1">
                💡 Potential Impact: {potential_impact}
              </p>
            )}
            {preview && (
              <p className="text-xs text-gray-500 mt-1">
                🧩 Preview: {preview}
              </p>
            )}
          </div>

          {/* 🆕 Action button */}
          {actionType && (
            <button
              onClick={() => onAction(actionType, insight.payload || {})}
              className="btn btn-xs sm:btn-sm btn-outline border-blue-500 text-blue-700 hover:bg-blue-50"
            >
              {action || "Run"}
            </button>
          )}
        </div>
      </div>
    );
  };

  // 🧠 Extract and flatten insights by category
  const sections = Object.entries(insights || {}).filter(
    ([key, value]) => Array.isArray(value) && value.length > 0,
  );

  if (!sections.length) {
    return (
      <div className="text-center text-sm text-[var(--text-muted)] py-4">
        No insights available for this dataset.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {sections.map(([category, list]) => (
        <div key={category} className="space-y-3">
          <h3 className="text-base font-semibold capitalize text-[var(--text-strong)]">
            {category.replace(/_/g, " ")}
          </h3>
          <div
            className={`grid gap-3 ${
              compact
                ? "sm:grid-cols-1"
                : "sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
            }`}
          >
            {list.map((insight, idx) => renderInsight(insight, idx, category))}
          </div>
        </div>
      ))}
    </div>
  );
}
