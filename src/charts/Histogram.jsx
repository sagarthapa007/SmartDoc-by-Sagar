import React, { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function buildBins(values, bins = 20) {
  const nums = values
    .map((v) => Number(String(v).replace(/,/g, "")))
    .filter((n) => !isNaN(n));
  if (!nums.length) return [];
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  const step = (max - min) / bins || 1;
  const edges = Array.from({ length: bins + 1 }, (_, i) => min + i * step);
  const counts = Array.from({ length: bins }, () => 0);
  nums.forEach((n) => {
    let idx = Math.floor((n - min) / step);
    if (idx >= bins) idx = bins - 1;
    if (idx < 0) idx = 0;
    counts[idx]++;
  });
  return counts.map((c, i) => ({
    range: `${edges[i].toFixed(2)}–${edges[i + 1].toFixed(2)}`,
    count: c,
  }));
}

export default function Histogram({ headers = [], rows = [] }) {
  const numericHeaders = useMemo(() => {
    return headers.filter((h) =>
      rows.some((r) => !isNaN(parseFloat(String(r?.[h]).replace(/,/g, "")))),
    );
  }, [headers, rows]);

  const [col, setCol] = useState(numericHeaders[0] || "");

  const data = useMemo(() => {
    if (!col) return [];
    const values = rows
      .map((r) => r?.[col])
      .filter((v) => v != null && v !== "");
    return buildBins(values, 20);
  }, [rows, col]);

  if (!numericHeaders.length) {
    return (
      <div className="text-xs text-gray-500">
        No numeric columns for histogram.
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-50">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-blue-700 font-semibold">Distribution Histogram</h3>
        <select
          className="text-xs border border-gray-200 rounded px-2 py-1"
          value={col}
          onChange={(e) => setCol(e.target.value)}
        >
          {numericHeaders.map((h) => (
            <option key={h} value={h}>
              {h}
            </option>
          ))}
        </select>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data}>
          <XAxis dataKey="range" hide />
          <YAxis />
          <Tooltip />
          <Bar dataKey="count" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
