import React from "react";

export default function PreviewTable({ headers = [], rows = [], maxHeight = "400px" }) {
  return (
    <div className="border border-[var(--border)] rounded-lg overflow-hidden">
      <div className="overflow-auto" style={{ maxHeight: "70vh" }}>
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-[var(--surface)] z-10">
            <tr>
              {headers.map((h) => (
                <th key={h} className="text-left px-3 py-2 border-b border-[var(--border)] whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => (
              <tr key={idx} className="odd:bg-[var(--muted)]/20">
                {headers.map((h) => (
                  <td key={h} className="px-3 py-2 border-b border-[var(--border)]">{String(r?.[h] ?? "")}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}