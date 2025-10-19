import React, { useState } from "react";
import { explainQuestion } from "@/utils/backendClient.js";

/**
 * 💬 Ask SmartDoc Panel
 * Lets the user type natural questions like:
 * “Why did revenue drop in March?” or “Show top customers.”
 */
export default function AskSmartDocPanel({ dataset }) {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [answers, setAnswers] = useState([]);

  const handleAsk = async () => {
    if (!question.trim()) return;
    setLoading(true);
    try {
      const res = await explainQuestion({
        headers: dataset.headers,
        rows: dataset.rows.slice(0, 500), // limit rows for speed
        question,
      });
      setAnswers(res?.explanation || []);
    } catch (err) {
      console.error("❌ AskSmartDoc failed:", err);
      setAnswers([{ text: "Failed to get explanation." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-4 space-y-3 border border-[var(--border)] bg-[var(--surface)]">
      <h3 className="text-base font-semibold text-[var(--text-strong)]">
        💬 Ask SmartDoc
      </h3>

      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          placeholder="Ask a question about your data..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          className="input input-bordered flex-1"
        />
        <button
          onClick={handleAsk}
          disabled={loading}
          className="btn btn-primary"
        >
          {loading ? "Thinking..." : "Ask"}
        </button>
      </div>

      <div className="space-y-2">
        {answers.map((a, i) => (
          <div
            key={i}
            className="p-2 rounded-md bg-[var(--muted)] text-sm leading-relaxed"
          >
            {a.text}
            {a.items && (
              <ul className="ml-4 list-disc text-xs mt-1">
                {a.items.map((it, j) => (
                  <li key={j}>
                    {it.name}: {it.total}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
