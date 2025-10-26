import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function RevenueTrendChart({ data }) {
  if (!data?.length) return null;
  return (
    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-50">
      <h3 className="text-blue-700 font-semibold mb-2">Revenue Trend</h3>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data}>
          <XAxis dataKey="period" />
          <YAxis />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="#2563eb"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
