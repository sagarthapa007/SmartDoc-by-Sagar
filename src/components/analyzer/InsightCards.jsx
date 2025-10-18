import React from "react";

export default function InsightCards({ insights }) {
  if (!insights) return null;
  const { technical, business } = insights;

  const cards = [
    { k: "Rows", v: technical?.summary?.rowCount },
    { k: "Columns", v: technical?.summary?.colCount },
    { k: "Missing Avg %", v: technical?.summary?.missingAvg },
    { k: "Detected Type", v: business?.context?.dataType || business?.dataType },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {cards.map(c => (
        <div key={c.k} className="bg-white border border-gray-100 rounded-2xl p-3 shadow-sm">
          <div className="text-xs text-gray-500">{c.k}</div>
          <div className="text-lg font-semibold text-gray-800">{valueText(c.v)}</div>
        </div>
      ))}
    </div>
  );
}

function valueText(v) {
  if (v == null) return "—";
  if (typeof v === "number") return Number(v).toLocaleString();
  return String(v);
}
