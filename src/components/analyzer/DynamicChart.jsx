
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function DynamicChart({ result }) {
  if (!result || !result.ok || !result.series) return null;
  const data = result.categories.map((cat, i) => ({ name: cat, value: result.series[i] }));

  return (
    <div className="p-4 border rounded-xl bg-white dark:bg-gray-900 shadow-sm">
      <h2 className="text-lg font-semibold mb-2">📊 Chart Preview</h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="value" fill="#60a5fa" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
