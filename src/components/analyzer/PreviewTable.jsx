import React from "react";

export default function PreviewTable({
  headers = [],
  rows = [],
  maxHeight = "300px",
}) {
  if (!headers.length || !rows.length) {
    return (
      <div className="text-sm text-gray-500 text-center py-6">
        No preview data available.
      </div>
    );
  }

  return (
    <div
      className="overflow-auto border border-gray-200 rounded-lg"
      style={{ maxHeight }}
    >
      <table className="min-w-full text-sm text-left border-collapse">
        <thead className="bg-gray-100 sticky top-0">
          <tr>
            {headers.map((h, i) => (
              <th
                key={i}
                className="px-3 py-2 font-semibold text-gray-700 border-b border-gray-200"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, 20).map((row, i) => (
            <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
              {headers.map((h, j) => (
                <td
                  key={j}
                  className="px-3 py-1.5 border-b border-gray-100 text-gray-700 truncate max-w-[200px]"
                  title={String(row[h] ?? "")}
                >
                  {String(row[h] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
