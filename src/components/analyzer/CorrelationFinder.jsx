import React, { useMemo, useState } from "react";
import useAnalyzeStore from "@/components/analyzer/analyze.store.js";

export default function CorrelationFinder({ dataset = [], onAuto }) {
  const headers = useMemo(() => Object.keys(dataset?.[0] || {}), [dataset]);
  const [target, setTarget] = useState("");
  const [threshold, setThreshold] = useState(0.5);

  const { correlations, runCorrelate, loading } = useAnalyzeStore();

  const handle = async () => {
    if (!target) return;
    await runCorrelate(target, threshold);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <select
          className="border px-3 py-2 rounded-md"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
        >
          <option value="">Target column…</option>
          {headers.map((h) => (
            <option key={h} value={h}>
              {h}
            </option>
          ))}
        </select>
        <input
          type="number"
          min="0"
          max="1"
          step="0.05"
          value={threshold}
          onChange={(e) => setThreshold(parseFloat(e.target.value || 0.5))}
          className="border px-3 py-2 rounded-md w-28"
          title="Min absolute correlation"
        />
        <button
          onClick={handle}
          disabled={!target || loading}
          className="bg-cyan-600 text-white px-4 py-2 rounded-md disabled:opacity-60"
        >
          {loading ? "Analyzing…" : "Analyze"}
        </button>
      </div>

      {correlations?.correlations?.length ? (
        <ul className="text-sm space-y-1">
          {correlations.correlations.map((c, i) => (
            <li key={i}>
              <span className="font-medium">{c.feature}</span>: r ={" "}
              {Number(c.r).toFixed(3)}
            </li>
          ))}
        </ul>
      ) : correlations?.matrix ? (
        <div className="text-sm text-gray-500">
          Correlation matrix computed. Pick a target to see strongest features.
        </div>
      ) : (
        <div className="text-sm text-gray-500">
          Pick a target to find strongest relationships.
        </div>
      )}
    </div>
  );
}
