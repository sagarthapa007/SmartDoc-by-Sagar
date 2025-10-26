import React, { useMemo } from "react";

export default function StatCards({ headers = [], rows = [] }) {
  const stats = useMemo(() => {
    const rowCount = rows?.length || 0;
    const colCount = headers?.length || 0;

    const missing = (() => {
      if (!rowCount || !colCount) return 0;
      let miss = 0,
        total = 0;
      for (let i = 0; i < Math.min(rowCount, 500); i++) {
        const r = rows[i];
        headers.forEach((h) => {
          total += 1;
          const v = r?.[h];
          if (
            v === null ||
            v === undefined ||
            v === "" ||
            (typeof v === "number" && Number.isNaN(v))
          )
            miss += 1;
        });
      }
      return Math.round((miss / Math.max(total, 1)) * 100);
    })();

    const numericCols = headers.filter((h) =>
      rows.some((r) => !isNaN(parseFloat(r?.[h]))),
    );

    return [
      { label: "Rows", value: rowCount.toLocaleString() },
      { label: "Columns", value: colCount },
      { label: "Missing %", value: `${missing}%` },
      { label: "Numeric Columns", value: numericCols.length },
    ];
  }, [headers, rows]);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
      {stats.map((s) => (
        <div
          key={s.label}
          className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-3 sm:px-4 sm:py-4"
        >
          <div className="text-[10px] sm:text-xs text-[var(--text-muted)] uppercase tracking-wide">
            {s.label}
          </div>
          <div className="text-base sm:text-xl font-semibold">{s.value}</div>
        </div>
      ))}
    </div>
  );
}
