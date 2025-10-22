
import React, { useState } from 'react';
import axios from 'axios';

export default function QueryBuilder({ dataset, onResult }) {
  const [metric, setMetric] = useState('');
  const [dimension, setDimension] = useState('');

  const handleRun = async () => {
    try {
      const res = await axios.post('/api/explore', {
        rows: dataset,
        metric,
        dimension,
      });
      onResult(res.data);
    } catch (err) {
      console.error('Query error', err);
    }
  };

  return (
    <div className="p-4 border rounded-xl bg-white dark:bg-gray-900 shadow-sm">
      <h2 className="text-lg font-semibold mb-2">🧩 Query Builder</h2>
      <div className="flex flex-wrap gap-2 mb-3">
        <select
          className="border px-3 py-2 rounded-md"
          value={metric}
          onChange={(e) => setMetric(e.target.value)}
        >
          <option value="">Select Metric</option>
          {Object.keys(dataset[0] || {}).map((key) => (
            <option key={key} value={key}>{key}</option>
          ))}
        </select>
        <select
          className="border px-3 py-2 rounded-md"
          value={dimension}
          onChange={(e) => setDimension(e.target.value)}
        >
          <option value="">Group by...</option>
          {Object.keys(dataset[0] || {}).map((key) => (
            <option key={key} value={key}>{key}</option>
          ))}
        </select>
        <button onClick={handleRun} className="bg-blue-600 text-white px-4 py-2 rounded-md">Run</button>
      </div>
    </div>
  );
}
