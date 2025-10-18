import React from "react";
import { FixedSizeList as List } from "react-window";

/**
 * 🧭 PreviewTable
 * Renders a virtualized preview of the dataset (first 200 rows).
 * Uses react-window for smooth scrolling and performance.
 */
export default function PreviewTable({ headers = [], rows = [] }) {
  const height = 260;
  const rowHeight = 32;
  const displayRows = rows.slice(0, 200);
  const columnWidth = 150;
  const totalWidth = headers.length * columnWidth;

  if (!headers.length || !rows.length) {
    return (
      <div className="card text-center p-6">
        <h3 className="font-semibold mb-2">No Data Loaded</h3>
        <p className="text-sm opacity-70">
          Upload a dataset to see a live preview here.
        </p>
      </div>
    );
  }

  return (
    <div className="card">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold">Preview</h3>
        <span className="badge">{rows.length.toLocaleString()} rows</span>
      </div>

      {/* Table Container */}
      <div
        style={{
          overflow: "auto",
          border: "1px solid var(--border)",
          borderRadius: 12,
          maxHeight: height + rowHeight + 2,
        }}
      >
        <div style={{ minWidth: totalWidth }}>
          {/* Sticky Header */}
          <div
            style={{
              position: "sticky",
              top: 0,
              background: "var(--card)",
              zIndex: 1,
              display: "grid",
              gridTemplateColumns: `repeat(${headers.length}, ${columnWidth}px)`,
              borderBottom: "1px solid var(--border)",
            }}
          >
            {headers.map((h, i) => (
              <div
                key={i}
                style={{
                  textAlign: "left",
                  padding: "8px 10px",
                  fontSize: 12,
                  fontWeight: 600,
                  opacity: 0.8,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {h}
              </div>
            ))}
          </div>

          {/* Virtualized Rows */}
          <List
            height={height}
            itemCount={displayRows.length}
            itemSize={rowHeight}
            width={totalWidth}
          >
            {({ index, style }) => {
              const row = displayRows[index];
              return (
                <div
                  style={{
                    ...style,
                    display: "grid",
                    gridTemplateColumns: `repeat(${headers.length}, ${columnWidth}px)`,
                    borderBottom: "1px solid var(--border)",
                    alignItems: "center",
                    fontSize: 13,
                  }}
                >
                  {headers.map((h, j) => (
                    <div
                      key={j}
                      style={{
                        padding: "0 10px",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {String(row[h] ?? "")}
                    </div>
                  ))}
                </div>
              );
            }}
          </List>
        </div>
      </div>
    </div>
  );
}
