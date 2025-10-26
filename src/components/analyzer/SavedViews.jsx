import React, { useEffect, useState } from "react";

const KEY = "smartdoc_saved_views";

export default function SavedViews({ query, onLoad }) {
  const [views, setViews] = useState([]);
  const [name, setName] = useState("");

  useEffect(() => {
    const raw = localStorage.getItem(KEY);
    setViews(raw ? JSON.parse(raw) : []);
  }, []);

  const save = () => {
    if (!name) return;
    const next = [...views, { id: crypto.randomUUID(), name, query }];
    setViews(next);
    localStorage.setItem(KEY, JSON.stringify(next));
    setName("");
  };

  const remove = (id) => {
    const next = views.filter((v) => v.id !== id);
    setViews(next);
    localStorage.setItem(KEY, JSON.stringify(next));
  };

  return (
    <div className="card">
      <h3 className="text-base font-semibold mb-3">Saved Views</h3>
      <div className="flex gap-2 mb-3">
        <input
          className="flex-1 border border-[var(--border)] rounded-lg px-3 py-2 bg-[var(--surface)] text-sm"
          placeholder="Name this view…"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button className="btn btn-secondary" onClick={save}>
          Save
        </button>
      </div>
      {views.length === 0 ? (
        <p className="text-sm text-[var(--text-tertiary)]">
          No saved views yet.
        </p>
      ) : (
        <div className="space-y-2">
          {views.map((v) => (
            <div
              key={v.id}
              className="flex items-center justify-between border border-[var(--border)] rounded-lg px-3 py-2"
            >
              <div className="text-sm font-medium">{v.name}</div>
              <div className="flex gap-2">
                <button
                  className="btn btn-secondary"
                  onClick={() => onLoad?.(v.query)}
                >
                  Load
                </button>
                <button
                  className="btn"
                  style={{ borderColor: "var(--border)" }}
                  onClick={() => remove(v.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
