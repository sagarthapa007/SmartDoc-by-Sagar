import React, { useRef } from "react";
import { useHistoryContext } from "@context/HistoryContext.jsx";

export default function HistoryLogger() {
  const { events, log, setEvents } = useHistoryContext();
  const fileRef = useRef();
  const saveJSON = () => {
    const blob = new Blob(
      [JSON.stringify({ version: "1.0", events }, null, 2)],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "smartdoc_history.json";
    a.click();
    URL.revokeObjectURL(url);
  };
  const loadJSON = (file) => {
    const fr = new FileReader();
    fr.onload = () => {
      try {
        const data = JSON.parse(fr.result);
        setEvents(data.events || []);
      } catch (e) {
        alert("Invalid history file");
      }
    };
    fr.readAsText(file);
  };
  return (
    <div className="grid gap-3">
      <div className="flex items-center gap-2">
        <button
          className="kbd"
          onClick={() => log("action", "User clicked log button")}
        >
          Add Test Event
        </button>
        <button className="kbd" onClick={saveJSON}>
          Export History (JSON)
        </button>
        <button className="kbd" onClick={() => fileRef.current?.click()}>
          Import History
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && loadJSON(e.target.files[0])}
        />
      </div>
      <div className="border rounded-xl p-3 max-h-80 overflow-auto text-sm">
        {events.length === 0 ? (
          <div className="opacity-70">No events yet.</div>
        ) : (
          events.map((ev, i) => (
            <div key={i} className="py-1 border-b border-[var(--border)]">
              <b>{ev.ts}</b> — {ev.type}:{" "}
              <span className="opacity-80">{ev.detail}</span>
            </div>
          ))
        )}
      </div>
      <div className="text-xs opacity-70">
        Store exported JSONs for long-term (5-year) comparisons; re-import
        anytime.
      </div>
    </div>
  );
}
