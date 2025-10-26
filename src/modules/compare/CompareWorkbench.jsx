import React, { useMemo, useState } from "react";
import { useSession } from "@context/SessionContext.jsx";
import { numericColumns, toSeries } from "@utils/analyze.js";

export default function CompareWorkbench() {
  const { session } = useSession();
  const ds = session?.dataset;
  const headers = ds?.headers || [];
  const rows = ds?.rows || [];
  const numeric = useMemo(() => numericColumns(headers, rows), [headers, rows]);
  const [mode, setMode] = useState("columns");
  const [a, setA] = useState(numeric[0] || "");
  const [b, setB] = useState(numeric[1] || "");

  if (!ds)
    return (
      <div className="opacity-70 text-sm">
        Upload a dataset to enable comparison.
      </div>
    );

  return (
    <div className="grid gap-3">
      <div className="flex items-center gap-2">
        <span className="badge">Mode</span>
        {["columns", "rows", "sheets"].map((m) => (
          <button
            key={m}
            className={"kbd " + (mode === m ? "ring-2 ring-brand-600" : "")}
            onClick={() => setMode(m)}
          >
            {m}
          </button>
        ))}
      </div>
      {mode === "columns" && (
        <div className="grid md:grid-cols-3 gap-3">
          <Select
            label="Column A"
            value={a}
            setValue={setA}
            options={numeric}
          />
          <Select
            label="Column B"
            value={b}
            setValue={setB}
            options={numeric}
          />
          <div className="card">
            <div className="text-sm opacity-70">Summary</div>
            <div className="text-lg font-semibold mt-1">
              Corr(A,B) = {corrPearson(toSeries(rows, a), toSeries(rows, b))}
            </div>
          </div>
        </div>
      )}
      {mode === "rows" && (
        <div className="opacity-70 text-sm">
          Row comparison UI stub — select two filters and see differences (Phase
          2).
        </div>
      )}
      {mode === "sheets" && (
        <div className="opacity-70 text-sm">
          Multi-sheet comparison requires multi-sheet ingest. This tab is
          scaffolded for A/B picking.
        </div>
      )}
    </div>
  );
}
function Select({ label, value, setValue, options }) {
  return (
    <div className="card">
      <div className="text-sm opacity-70">{label}</div>
      <select
        className="badge mt-2"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}
function corrPearson(a, b) {
  const n = Math.min(a.length, b.length);
  if (n < 3) return "—";
  const ma = mean(a.slice(0, n)),
    mb = mean(b.slice(0, n));
  let num = 0,
    da = 0,
    db = 0;
  for (let i = 0; i < n; i++) {
    const x = a[i] - ma,
      y = b[i] - mb;
    num += x * y;
    da += x * x;
    db += y * y;
  }
  const r = num / Math.sqrt(da * db);
  return Number.isFinite(r) ? r.toFixed(3) : "—";
}
function mean(arr) {
  return arr.reduce((s, v) => s + v, 0) / (arr.length || 1);
}
