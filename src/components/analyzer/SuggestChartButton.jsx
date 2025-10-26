import React, { useState } from "react";
import { suggestCharts } from "@/utils/backendClient.js";

/**
 * ✨ SuggestChartButton
 * Requests recommended chart types from backend intelligence.
 */
export default function SuggestChartButton({ dataset }) {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);

  const handleSuggest = async () => {
    setLoading(true);
    try {
      const res = await suggestCharts({ columns: dataset.headers });
      setSuggestions(res?.suggestions || []);
    } catch (err) {
      console.error("❌ SuggestCharts failed:", err);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-4 space-y-3 border border-[var(--border)] bg-[var(--surface)]">
      <div className="flex justify-between items-center">
        <h3 className="text-base font-semibold text-[var(--text-strong)]">
          ✨ Smart Chart Suggestions
        </h3>
        <button
          onClick={handleSuggest}
          disabled={loading}
          className="btn btn-sm btn-outline"
        >
          {loading ? "Analyzing..." : "Suggest"}
        </button>
      </div>

      {suggestions.length > 0 && (
        <ul className="text-sm space-y-2">
          {suggestions.map((s, i) => (
            <li key={i} className="p-2 rounded-md bg-[var(--muted)]">
              <strong>{s.chart_type.toUpperCase()}</strong> – {s.reasoning}
              {s.x_axis && (
                <div className="text-xs text-gray-500 mt-1">
                  X: {s.x_axis} {s.y_axis && <>| Y: {s.y_axis}</>}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
