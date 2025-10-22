// src/components/ui/TopbarButton.jsx
import React from "react";

export function Button({ icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-[var(--brandA)] text-white hover:opacity-90 active:opacity-100 transition shadow-sm"
    >
      {icon}
      <span className="hidden sm:block">{label}</span>
    </button>
  );
}
