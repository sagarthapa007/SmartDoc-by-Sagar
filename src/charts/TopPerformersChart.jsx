import React from "react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

export default function TopPerformersChart({ data, metric = "revenue", title = "Top Performers" }) {
  if (!data?.length) return null;
  return (
    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-50">
      <h3 className="text-blue-700 font-semibold mb-2">{title}</h3>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} layout="vertical" margin={{ left: 30 }}>
          <XAxis type="number" />
          <YAxis type="category" dataKey="name" width={120} />
          <Tooltip />
          <Bar dataKey={metric} fill="#1e40af" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
