import React from "react";

export default function NarrativePanel({ insights }) {
  if (!insights) return null;
  const { technical, business, quality } = insights;

  return (
    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-50">
      <h3 className="text-blue-700 font-semibold mb-2">AI Narrative</h3>
      <p className="text-gray-700 text-sm leading-relaxed">
        The dataset contains <b>{technical?.summary?.rowCount ?? "—"}</b> records and{" "}
        <b>{technical?.summary?.colCount ?? "—"}</b> fields.
        {business?.context?.dataType && (
          <> It appears to represent <b>{business.context.dataType}</b> data.</>
        )}{" "}
        Overall data quality is <b>{quality?.overall ?? "—"}%</b>.
      </p>
      {business?.kpis && business?.kpis?.trends && (
        <p className="text-gray-700 text-sm mt-2">
          Primary metric <b>{business.kpis.primaryMetric}</b> shows{" "}
          <b>{(business.kpis.trends.growth * 100).toFixed(1)}%</b>{" "}
          {business.kpis.trends.direction} growth.
        </p>
      )}
    </div>
  );
}
