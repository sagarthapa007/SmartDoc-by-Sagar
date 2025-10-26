import React, { useMemo } from "react";

/** Compute Pearson correlation between two numeric arrays */
function corr(a, b) {
  const n = Math.min(a.length, b.length);
  if (n === 0) return 0;
  const ax = a.slice(0, n);
  const bx = b.slice(0, n);
  const mean = (arr) => arr.reduce((s, v) => s + v, 0) / arr.length;
  const ma = mean(ax),
    mb = mean(bx);
  let num = 0,
    da = 0,
    db = 0;
  for (let i = 0; i < n; i++) {
    const x = ax[i] - ma,
      y = bx[i] - mb;
    num += x * y;
    da += x * x;
    db += y * y;
  }
  const denom = Math.sqrt(da * db) || 1;
  return num / denom;
}

function toNumericColumn(rows, key) {
  return rows
    .map((r) => Number(String(r?.[key]).replace(/,/g, "")))
    .filter((x) => !isNaN(x));
}

export default function Heatmap({ headers = [], rows = [] }) {
  const numericHeaders = useMemo(() => {
    return headers.filter((h) =>
      rows.some((r) => !isNaN(parseFloat(String(r?.[h]).replace(/,/g, "")))),
    );
  }, [headers, rows]);

  const matrix = useMemo(() => {
    const cols = numericHeaders.map((h) => toNumericColumn(rows, h));
    const m = numericHeaders.length;
    const mat = Array.from({ length: m }, () => Array(m).fill(0));
    for (let i = 0; i < m; i++) {
      for (let j = i; j < m; j++) {
        const c = i === j ? 1 : corr(cols[i], cols[j]);
        mat[i][j] = c;
        mat[j][i] = c;
      }
    }
    return mat;
  }, [numericHeaders, rows]);

  if (!numericHeaders.length) {
    return (
      <div className="text-xs text-gray-500">
        No numeric columns for correlation heatmap.
      </div>
    );
  }

  // rendering constants
  const cell = 26;
  const padLeft = 120;
  const padTop = 24;
  const sizeX = padLeft + cell * numericHeaders.length + 12;
  const sizeY = padTop + cell * numericHeaders.length + 12;

  const color = (v) => {
    // v in [-1, 1] → blue to white to red
    const t = (v + 1) / 2; // [0,1]
    const r = Math.round(255 * t);
    const b = Math.round(255 * (1 - t));
    return `rgb(${r}, 180, ${b})`;
  };

  return (
    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-50">
      <h3 className="text-blue-700 font-semibold mb-2">Correlation Heatmap</h3>
      <svg width="100%" viewBox={`0 0 ${sizeX} ${sizeY}`} role="img">
        {/* Y labels */}
        {numericHeaders.map((h, i) => (
          <text
            key={`ylab-${i}`}
            x={padLeft - 8}
            y={padTop + i * cell + cell * 0.65}
            fontSize="10"
            textAnchor="end"
            fill="#374151"
          >
            {h}
          </text>
        ))}
        {/* X labels */}
        {numericHeaders.map((h, j) => (
          <text
            key={`xlab-${j}`}
            x={padLeft + j * cell + cell * 0.5}
            y={14}
            fontSize="10"
            textAnchor="middle"
            fill="#374151"
            transform={`rotate(-30 ${padLeft + j * cell + cell * 0.5},14)`}
          >
            {h}
          </text>
        ))}
        {/* Cells */}
        {matrix.map((row, i) =>
          row.map((v, j) => (
            <g key={`c-${i}-${j}`}>
              <rect
                x={padLeft + j * cell}
                y={padTop + i * cell}
                width={cell - 1}
                height={cell - 1}
                fill={color(v)}
                rx="3"
              />
              <title>{`${numericHeaders[i]} vs ${numericHeaders[j]}: ${v.toFixed(2)}`}</title>
              {i === j && (
                <text
                  x={padLeft + j * cell + cell / 2}
                  y={padTop + i * cell + cell / 2 + 3}
                  fontSize="9"
                  textAnchor="middle"
                  fill="#111827"
                >
                  1.00
                </text>
              )}
            </g>
          )),
        )}
        {/* Border */}
        <rect
          x={padLeft - 1}
          y={padTop - 1}
          width={cell * numericHeaders.length + 2}
          height={cell * numericHeaders.length + 2}
          fill="none"
          stroke="#e5e7eb"
        />
      </svg>
      <div className="text-[10px] text-gray-500 mt-2">
        Tip: hover a square to see exact correlation.
      </div>
    </div>
  );
}
