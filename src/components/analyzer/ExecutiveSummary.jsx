import React from "react";

export default function ExecutiveSummary({
  kpis = {},
  trends = {},
  summary = {},
}) {
  if (!kpis?.primaryMetric) return null;

  const items = [
    { label: "Primary Metric", value: String(kpis.primaryMetric) },
    {
      label: "Growth",
      value:
        trends?.growth != null ? `${(trends.growth * 100).toFixed(1)}%` : "—",
    },
    { label: "Direction", value: trends?.direction || "—" },
    {
      label: "Confidence",
      value:
        kpis?.confidence != null
          ? `${Math.round(kpis.confidence * 100)}%`
          : "—",
    },
  ];

  const basic = [
    { label: "Σ Sum", value: toNumberText(summary.sum) },
    { label: "μ Avg", value: toFixedText(summary.avg, 2) },
    { label: "Min", value: toNumberText(summary.min) },
    { label: "Max", value: toNumberText(summary.max) },
  ];

  return (
    <section className="p-4 bg-white rounded-2xl shadow-sm mb-4 border border-gray-50">
      <h2 className="text-base md:text-lg font-semibold mb-3 text-blue-700">
        Executive Summary
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
        {items.map((it) => (
          <KpiCard key={it.label} title={it.label} value={it.value} />
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {basic.map((it) => (
          <MiniStat key={it.label} title={it.label} value={it.value} />
        ))}
      </div>
    </section>
  );
}

function KpiCard({ title, value }) {
  return (
    <div className="bg-blue-50/60 p-3 rounded-xl text-center border border-blue-100">
      <div className="text-xs text-gray-600">{title}</div>
      <div className="text-lg font-semibold text-blue-900">{value ?? "—"}</div>
    </div>
  );
}

function MiniStat({ title, value }) {
  return (
    <div className="bg-gray-50 p-3 rounded-xl text-center border border-gray-200">
      <div className="text-xs text-gray-600">{title}</div>
      <div className="text-base font-semibold text-gray-800">
        {value ?? "—"}
      </div>
    </div>
  );
}

function toNumberText(v) {
  const n = Number(v);
  return isNaN(n) ? "—" : n.toLocaleString();
}
function toFixedText(v, d = 2) {
  const n = Number(v);
  return isNaN(n) ? "—" : n.toFixed(d);
}
