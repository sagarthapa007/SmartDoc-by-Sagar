import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function HeaderConfirmBanner({ detection, headers, onChangeHeader, onDismiss }) {
  const [showPicker, setShowPicker] = useState(false);
  if (!detection) return null;

  const {
    confidence = "low",
    score = 0,
    headerIndex = 0,
    confirmed = false,
    alternatives = [],
    lines = [],
  } = detection;

  const theme = useMemo(() => {
    const map = {
      high: {
        ring: "ring-emerald-400/40",
        chip: "bg-emerald-500 text-white",
        pill: "text-emerald-600 bg-emerald-100 dark:text-emerald-300 dark:bg-emerald-900/30",
        icon: "✓",
      },
      medium: {
        ring: "ring-amber-400/40",
        chip: "bg-amber-500 text-white",
        pill: "text-amber-600 bg-amber-100 dark:text-amber-300 dark:bg-amber-900/30",
        icon: "⚡",
      },
      low: {
        ring: "ring-rose-400/40",
        chip: "bg-rose-500 text-white",
        pill: "text-rose-600 bg-rose-100 dark:text-rose-300 dark:bg-rose-900/30",
        icon: "?",
      },
    };
    return map[confidence] || map.low;
  }, [confidence]);

  const showHeaders = useMemo(() => {
    const raw = headers?.length
      ? headers
      : lines[headerIndex]?.split(/[,\t|;]/).map((h) => h.trim()) ?? [];
    return raw.slice(0, 6);
  }, [headers, lines, headerIndex]);

  const extraCount = useMemo(() => {
    const len = headers?.length
      ? headers.length
      : (lines[headerIndex]?.split(/[,\t|;]/).length ?? 0);
    return Math.max(0, len - 6);
  }, [headers, lines, headerIndex]);

  return (
    <>
      <div
        className={`rounded-xl border border-gray-200 bg-white p-4 sm:p-5 ring-1 ${theme.ring}`}
      >
        <div className="flex items-start gap-3 sm:gap-4">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0 ${theme.pill}`}
          >
            {theme.icon}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <h4 className="text-sm sm:text-base font-semibold m-0">
                Header Row {confirmed ? "Confirmed" : "Detected"}
              </h4>
              <span
                className={`text-[11px] px-2 py-1 rounded-md font-semibold ${theme.chip}`}
              >
                Row {headerIndex + 1}
              </span>
              <span
                className={`text-[11px] px-2 py-1 rounded-md font-medium ${theme.pill}`}
              >
                {Math.round(Number(score) || 0)}% confidence
              </span>
            </div>

            <p className="text-xs sm:text-sm text-gray-600 mb-3">
              {confidence === "high" &&
                "We're confident this is your header row, but you can change it anytime."}
              {confidence === "medium" &&
                "This looks like your header row — please verify or change if needed."}
              {confidence === "low" &&
                "Confidence is low. Please verify carefully or confirm to proceed."}
            </p>

            <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-2.5 mb-3">
              <div className="flex flex-wrap gap-1.5">
                {showHeaders.map((h, i) => (
                  <span
                    key={i}
                    className="text-[11px] sm:text-xs px-2 py-1 rounded bg-gray-100"
                  >
                    {h || <em>empty</em>}
                  </span>
                ))}
                {extraCount > 0 && (
                  <span className="text-[11px] sm:text-xs px-2 py-1 rounded opacity-60">
                    +{extraCount} more
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setShowPicker(true)}
                className="px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-300 hover:bg-gray-50 transition"
              >
                Change Header Row
              </button>

              <button
                type="button"
                onClick={onDismiss}
                className="px-3 py-1.5 rounded-lg text-sm font-medium text-white bg-blue-600 hover:opacity-90 transition"
              >
                Looks Good
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Picker Modal */}
      <AnimatePresence>
        {showPicker && (
          <>
            <motion.div
              className="fixed inset-0 z-[60] bg-black/50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPicker(false)}
            />
            <motion.div
              className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-3 sm:p-6"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              transition={{ duration: 0.18 }}
              onClick={() => setShowPicker(false)}
            >
              <div
                className="w-full max-w-full sm:max-w-2xl bg-white border border-gray-200 rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden"
                style={{ maxHeight: "85vh" }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-4 sm:p-5 border-b border-gray-200">
                  <h3 className="text-base sm:text-lg font-semibold">
                    Select Header Row
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600">
                    Choose which row contains your column headers
                  </p>
                </div>

                <div
                  className="p-3 sm:p-4 overflow-y-auto"
                  style={{ maxHeight: "calc(85vh - 120px)" }}
                >
                  <div className="space-y-2">
                    {(lines || []).slice(0, 10).map((line, idx) => {
                      const isSelected = idx === headerIndex;
                      const altScore = alternatives.find(
                        (a) => a.index === idx
                      )?.score;
                      return (
                        <button
                          key={idx}
                          onClick={() => {
                            onChangeHeader(idx);
                            setShowPicker(false);
                          }}
                          className={`w-full text-left px-3 py-3 rounded-lg border transition
                            ${
                              isSelected
                                ? "border-blue-600 bg-blue-50"
                                : "border-gray-200 hover:bg-gray-50"
                            }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className={`inline-flex items-center justify-center w-7 h-7 rounded-md text-xs font-semibold
                              ${
                                isSelected
                                  ? "bg-blue-600 text-white"
                                  : "bg-gray-100"
                              }`}
                            >
                              {idx + 1}
                            </span>
                            {isSelected && (
                              <span className="text-[11px] font-semibold text-blue-600">
                                CURRENT
                              </span>
                            )}
                            {typeof altScore === "number" && (
                              <span className="text-[11px] px-2 py-0.5 rounded bg-gray-100 opacity-80">
                                {Math.round(altScore)}% match
                              </span>
                            )}
                          </div>
                          <code className="block text-[11px] sm:text-xs truncate">
                            {line}
                          </code>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="p-3 sm:p-4 border-t border-gray-200 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowPicker(false)}
                    className="px-3 py-2 rounded-lg text-sm border border-gray-300 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}