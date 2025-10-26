import React from "react";

export default function QualityPanel({ quality }) {
  const missing = quality?.missing || {};
  const totalIssues = Object.values(missing).reduce((a, b) => a + b, 0);

  return (
    <div className="card">
      <h3 className="text-base font-semibold mb-3">Quality</h3>
      {totalIssues === 0 ? (
        <div className="text-sm text-[var(--text-tertiary)]">
          No obvious issues detected.
        </div>
      ) : (
        <div className="space-y-2">
          {Object.entries(missing).map(([col, count]) => (
            <div
              key={col}
              className="flex items-center justify-between border border-[var(--border)] rounded-lg px-3 py-2"
            >
              <span className="font-medium">{col}</span>
              <span className="text-xs">Missing: {count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
