import React, { useState } from "react";

export default function MultiFilterPanel({ data, onFilter }) {
  const headers = Object.keys(data?.[0] || {});
  const [filters, setFilters] = useState({});

  const apply = (newFilters) => {
    const filtered = (data || []).filter((row) =>
      Object.entries(newFilters).every(([key, v]) =>
        String(row?.[key] ?? "")
          .toLowerCase()
          .includes(String(v ?? "").toLowerCase()),
      ),
    );
    onFilter?.(filtered);
  };

  const handleChange = (h, val) => {
    const nf = { ...filters, [h]: val };
    setFilters(nf);
    apply(nf);
  };

  if (!headers.length) return null;
  return (
    <div className="bg-white p-3 rounded-2xl shadow-sm mb-3 border border-gray-50">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-blue-700 font-semibold">Multi Filter</h3>
        <button
          className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200"
          onClick={() => {
            setFilters({});
            apply({});
          }}
        >
          Clear
        </button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {headers.map((h) => (
          <input
            key={h}
            placeholder={`Filter ${h}`}
            className="border border-gray-200 text-xs px-2 py-1 rounded"
            value={filters[h] ?? ""}
            onChange={(e) => handleChange(h, e.target.value)}
          />
        ))}
      </div>
    </div>
  );
}
