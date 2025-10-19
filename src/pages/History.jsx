import React from "react";

export default function History() {
  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-2">History</h1>
      <p className="text-sm text-[var(--text-muted)]">
        Your analysis and document generation history will appear here.
      </p>
      <div className="mt-4 card p-4">
        <p className="text-sm">Coming soon: persisted runs, filters, CSV/PDF export.</p>
      </div>
    </div>
  );
}