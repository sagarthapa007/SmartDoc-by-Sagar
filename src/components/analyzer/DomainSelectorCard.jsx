import React from "react";

export default function DomainSelectorCard({ context, domains, onChange }) {
  const confidenceColor =
    context.confidence > 0.8 ? "text-green-500" :
    context.confidence > 0.6 ? "text-yellow-500" :
    "text-red-500";

  return (
    <div className="card fade-in mb-4 p-4 bg-[var(--surface)] rounded-2xl shadow-sm border border-[var(--border)]">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-semibold text-sm opacity-90 mb-1">🧭 Detected Domain</h3>
          <p className="text-base font-medium">
            <span className="capitalize">{context.domain}</span>{" "}
            <span className={`${confidenceColor} text-sm ml-1`}>
              ({Math.round(context.confidence * 100)}% confidence)
            </span>
          </p>
        </div>

        <div className="mt-3 sm:mt-0">
          <label className="text-sm opacity-80 mr-2">Change Domain:</label>
          <select
            className="bg-[var(--input-bg)] border border-[var(--border)] rounded-lg px-2 py-1 text-sm"
            value={context.domain}
            onChange={(e) => onChange(e.target.value)}
          >
            {domains.map((d) => (
              <option key={d.code} value={d.code}>
                {d.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
