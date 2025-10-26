import React, { useState } from "react";
export default function ControlsPanel() {
  const [confidence, setConfidence] = useState(95);
  const [zscore, setZscore] = useState(3);
  const [bins, setBins] = useState(20);
  const [logic, setLogic] = useState("AND");
  return (
    <div className="grid md:grid-cols-2 gap-3">
      <div className="card">
        <div className="font-semibold mb-2">Global Analysis Settings</div>
        <div className="grid gap-2 text-sm">
          <label className="flex items-center justify-between gap-2">
            Confidence (%)
            <input
              type="number"
              className="badge"
              value={confidence}
              onChange={(e) => setConfidence(+e.target.value || 95)}
            />
          </label>
          <label className="flex items-center justify-between gap-2">
            Outlier Z-score
            <input
              type="number"
              className="badge"
              value={zscore}
              onChange={(e) => setZscore(+e.target.value || 3)}
            />
          </label>
          <label className="flex items-center justify-between gap-2">
            Histogram Bins
            <input
              type="number"
              className="badge"
              value={bins}
              onChange={(e) => setBins(+e.target.value || 20)}
            />
          </label>
          <label className="flex items-center justify-between gap-2">
            Filter Logic
            <select
              className="badge"
              value={logic}
              onChange={(e) => setLogic(e.target.value)}
            >
              <option>AND</option>
              <option>OR</option>
            </select>
          </label>
        </div>
      </div>
      <div className="card">
        <div className="font-semibold mb-2">Notes</div>
        <div className="text-sm opacity-70">
          Modules will read these settings from a central config store.
        </div>
      </div>
    </div>
  );
}
