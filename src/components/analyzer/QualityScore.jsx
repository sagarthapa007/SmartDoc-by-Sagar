import React from "react";

export default function QualityScore({ quality }) {
  if (!quality) return null;
  const { overall, dimensions = {} } = quality;

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-50">
      <h3 className="text-blue-700 font-semibold mb-2">Data Quality</h3>
      <div className="text-3xl font-bold text-blue-800 mb-3">
        {overall ?? "—"}%
      </div>
      <div className="space-y-2">
        {Object.entries(dimensions).map(([dim, val]) => (
          <Bar key={dim} label={dim} value={val} />
        ))}
      </div>
    </div>
  );
}

function Bar({ label, value }) {
  const pct = Math.round((value ?? 0) * 100);
  return (
    <div>
      <div className="flex justify-between text-xs text-gray-600">
        <span className="capitalize">{label}</span>
        <span>{pct}%</span>
      </div>
      <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
        <div className="h-2 bg-blue-500" style={{ width: `${pct}%` }}></div>
      </div>
    </div>
  );
}
