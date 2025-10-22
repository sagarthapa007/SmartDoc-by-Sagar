import React from "react";

export default function DataStructurePanel({ schema = [] }) {
  const cols = Array.isArray(schema) ? schema : [];
  if (!cols.length) {
    return (
      <div className="text-sm text-gray-500">
        Upload a file to detect structure.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-left py-1">Column</th>
            <th className="text-left py-1">Type</th>
            <th className="text-left py-1">Unique</th>
            <th className="text-left py-1">Examples</th>
          </tr>
        </thead>
        <tbody>
          {cols.map((col, i) => (
            <tr key={i} className="border-b">
              <td className="py-1">{col.name}</td>
              <td className="py-1 text-gray-500">{col.type ?? "—"}</td>
              <td className="py-1">{col.uniqueCount ?? col.unique_count ?? "—"}</td>
              <td className="py-1 text-gray-500">
                {(col.examples ?? []).slice(0, 3).join(", ")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
