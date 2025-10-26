import React from "react";
import { X, ArrowRight } from "lucide-react";

export default function FeatureModal({
  isOpen,
  feature,
  onClose,
  onTry,
  onLearn,
}) {
  if (!isOpen || !feature) return null;

  const Icon = feature.icon;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`${feature.title} details`}
    >
      {/* Glassmorphic overlay */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        className="relative w-full max-w-lg rounded-2xl border shadow-xl overflow-hidden"
        style={{ background: "var(--card)", borderColor: "var(--border)" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-4 border-b"
          style={{ borderColor: "var(--border)" }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[var(--brand1)]/10 text-[var(--brand1)]">
              {Icon ? <Icon className="w-5 h-5" /> : null}
            </div>
            <div>
              <div className="text-base font-semibold">{feature.title}</div>
              <div className="text-xs text-[var(--text-secondary)]">
                SmartDoc feature preview
              </div>
            </div>
          </div>
          <button className="kbd" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-4">
          <p className="text-sm text-[var(--text-secondary)]">{feature.desc}</p>

          {Array.isArray(feature.bullets) && (
            <ul className="mt-3 grid grid-cols-1 gap-2">
              {feature.bullets.map((b, idx) => (
                <li key={idx} className="text-sm">
                  <span className="text-[var(--brand1)] mr-2">•</span>
                  <span className="text-[var(--text)]">{b}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-end gap-2 p-4 border-t"
          style={{ borderColor: "var(--border)" }}
        >
          <button className="btn btn-ghost" onClick={onLearn}>
            Learn more
          </button>
          <button
            className="btn btn-primary flex items-center gap-2"
            onClick={onTry}
          >
            Try feature <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
