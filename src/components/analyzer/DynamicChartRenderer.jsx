import React from "react";
import RevenueTrendChart from "@charts/RevenueTrendChart.jsx";
import TopPerformersChart from "@charts/TopPerformersChart.jsx";
import Heatmap from "@charts/Heatmap.jsx";
import Histogram from "@charts/Histogram.jsx";

/**
 * Renders charts based on domain config + available visuals from analysis.
 * Props:
 * - domain: detected/overridden domain code
 * - visuals: registry (from DOMAIN_VISUALS)
 * - analysis: full analysis object (to access analysis.visuals.trend / ranking)
 * - headers, rows: for generic charts (heatmap/histogram)
 */
export default function DynamicChartRenderer({ domain, registry, analysis, headers, rows }) {
  const cfg = registry[domain] || registry.generic;
  const a = analysis || {};
  const trendData = a.visuals?.trend;
  const rankingData = a.visuals?.ranking;

  const renderChart = (name) => {
    switch (name) {
      case "RevenueTrendChart":
        return <RevenueTrendChart data={trendData || []} title="Trend" />;
      case "TopPerformersChart":
        return <TopPerformersChart data={rankingData || []} title="Top Ranking" metric={a?.context?.metrics?.[0]} />;
      case "Heatmap":
        return <Heatmap headers={headers} rows={rows} />;
      case "Histogram":
        return <Histogram headers={headers} rows={rows} />;
      default:
        return <div className="text-sm opacity-60">No chart available.</div>;
    }
  };

  return (
    <div className="space-y-2">
      <h3 className="text-base font-semibold">{cfg.title}</h3>
      <p className="text-sm opacity-70">{cfg.description}</p>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {cfg.charts.map((ch) => (
          <div key={ch} className="card fade-in">{renderChart(ch)}</div>
        ))}
      </div>
    </div>
  );
}
