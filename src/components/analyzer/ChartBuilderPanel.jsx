import React, { useState } from "react";
import Heatmap from "@charts/Heatmap.jsx";
import Histogram from "@charts/Histogram.jsx";
import RevenueTrendChart from "@charts/RevenueTrendChart.jsx";
import TopPerformersChart from "@charts/TopPerformersChart.jsx";

/**
 * ChartBuilderPanel — Phase G3
 * Lets users choose columns + chart type and renders accordingly.
 */
export default function ChartBuilderPanel({ headers = [], rows = [] }) {
  const [xAxis, setXAxis] = useState("");
  const [yAxis, setYAxis] = useState("");
  const [chartType, setChartType] = useState("histogram");

  const chartTypes = [
    { id: "histogram", label: "Histogram" },
    { id: "heatmap", label: "Heatmap (numeric correlation)" },
    { id: "bar", label: "Bar (Top Distribution)" },
    { id: "line", label: "Line (Trend)" },
    { id: "pie", label: "Pie (Top Distribution)" },
  ];

  const render = () => {
    switch (chartType) {
      case "heatmap":
        return <Heatmap headers={headers} rows={rows} />;
      case "histogram":
        return <Histogram headers={headers} rows={rows} />;
      case "bar":
      case "pie":
        return <TopPerformersChart data={buildTop(rows, xAxis, yAxis)} metric={yAxis} title="Top Distribution" />;
      case "line":
        return <RevenueTrendChart data={buildTrend(rows, xAxis, yAxis)} title="Line Trend" />;
      default:
        return <div className="text-sm opacity-60">Choose chart type & columns.</div>;
    }
  };

  return (
    <div className="card fade-in p-4 space-y-4">
      <h3 className="text-base font-semibold">🧩 Custom Chart Builder</h3>

      <div className="flex gap-3 items-center flex-wrap">
        <label className="text-sm">Chart Type</label>
        <select className="select select-sm border rounded-md" value={chartType} onChange={(e)=>setChartType(e.target.value)}>
          {chartTypes.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
        </select>
      </div>

      <div className="flex flex-wrap gap-4">
        <div>
          <label className="block text-xs mb-1">X Axis / Category</label>
          <select className="select select-sm border rounded-md" value={xAxis} onChange={(e)=>setXAxis(e.target.value)}>
            <option value="">Select column</option>
            {headers.map(h => <option key={h} value={h}>{h}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs mb-1">Y Axis / Value</label>
          <select className="select select-sm border rounded-md" value={yAxis} onChange={(e)=>setYAxis(e.target.value)}>
            <option value="">Select column</option>
            {headers.map(h => <option key={h} value={h}>{h}</option>)}
          </select>
        </div>
      </div>

      <div className="min-h-[320px]">{render()}</div>
    </div>
  );
}

// Helpers
function buildTop(rows, key, metric) {
  if (!key || !metric) return [];
  const map = {};
  rows.forEach(r => {
    const k = r[key];
    const v = parseFloat(r[metric]) || 0;
    if (!k) return;
    map[k] = (map[k] || 0) + v;
  });
  return Object.entries(map).sort((a,b)=>b[1]-a[1]).slice(0,10).map(([name, val])=>({ [key]: name, [metric]: val }));
}

function buildTrend(rows, xKey, yKey) {
  // xKey can be a date/time column; group by month if possible
  if (!xKey || !yKey) return [];
  const monthly = {};
  rows.forEach(r => {
    const raw = r[xKey];
    const val = parseFloat(r[yKey]) || 0;
    const d = new Date(raw);
    const k = isNaN(d) ? String(raw) : `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
    monthly[k] = (monthly[k] || 0) + val;
  });
  return Object.entries(monthly).sort(([a],[b])=>a>b?1:-1).map(([month, value])=>({ month, revenue: value }));
}
