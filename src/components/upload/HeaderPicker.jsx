import React from "react";

/**
 * Minimal, theme-aware modal for selecting header row manually.
 */
export default function HeaderPicker({ lines, onSelect, onCancel }) {
  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{
        background: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(4px)',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={onCancel}
    >
      <div 
        className="bg-[var(--card)] text-[var(--text)] border border-[var(--border)] rounded-2xl w-full max-w-2xl shadow-2xl"
        style={{
          animation: 'slideUp 0.3s ease-out',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-[var(--border)]">
          <h3 className="text-xl font-semibold mb-2">Select Header Row</h3>
          <p className="text-sm opacity-70">
            SmartDoc couldn't confidently detect headers. Please choose the correct header line:
          </p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4" style={{ minHeight: 0 }}>
          <div className="space-y-2">
            {lines.slice(0, 10).map((line, idx) => (
              <button
                key={idx}
                onClick={() => onSelect(idx)}
                className="block w-full text-left px-4 py-3 rounded-lg border border-[var(--border)] hover:border-[var(--brand)] hover:bg-[var(--muted)] transition-all duration-200 group"
                style={{
                  background: 'var(--card)',
                  position: 'relative'
                }}
              >
                <div className="flex items-start gap-3">
                  <span 
                    className="flex-shrink-0 w-6 h-6 rounded-full bg-[var(--muted)] flex items-center justify-center text-xs font-medium group-hover:bg-[var(--brand)] group-hover:text-white transition-all"
                  >
                    {idx + 1}
                  </span>
                  <code className="text-xs leading-relaxed break-all flex-1" style={{ fontFamily: 'monospace' }}>
                    {line}
                  </code>
                </div>
              </button>
            ))}
          </div>
        </div>
        
        <div className="p-6 border-t border-[var(--border)] flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-5 py-2.5 rounded-lg border border-[var(--border)] text-sm font-medium hover:bg-[var(--muted)] transition-all"
          >
            Cancel
          </button>
          <button
            onClick={() => onSelect(0)}
            className="px-5 py-2.5 rounded-lg text-sm font-medium text-white transition-all hover:shadow-lg hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, var(--brand), var(--accent))'
            }}
          >
            Use First Row
          </button>
        </div>
      </div>
      
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
}