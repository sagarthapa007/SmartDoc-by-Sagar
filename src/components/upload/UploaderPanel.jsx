import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { ingestFile } from "@utils/ingest";
import { useSession } from "@context/SessionContext.jsx";
import HeaderConfirmBanner from "./HeaderConfirmBanner";
import Papa from "papaparse";

export default function UploaderPanel() {
  const { session, setSession } = useSession();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);
  const [originalFileText, setOriginalFileText] = useState(null);
  const inputRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    if (location?.state?.autoOpen && inputRef.current) {
      const t = setTimeout(() => inputRef.current?.click(), 300);
      return () => clearTimeout(t);
    }
  }, [location?.state?.autoOpen]);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (session?.dataset) {
      setPendingFile(file);
      setShowConfirm(true);
      return;
    }
    await processFile(file);
  }

  async function processFile(file) {
    try {
      setSession((prev) => ({ ...prev, dataset: null }));
      await new Promise((res) => setTimeout(res, 150));
      setBusy(true);
      setError("");

      if (file.name.toLowerCase().endsWith(".csv")) {
        const text = await file.text();
        setOriginalFileText(text);
      } else {
        setOriginalFileText(null);
      }

      const result = await ingestFile(file);
      setSession((prev) => ({ ...prev, dataset: result }));
    } catch (err) {
      console.error("❌ Upload failed:", err);
      setError("Failed to read file. Please try again.");
    } finally {
      setBusy(false);
      setShowConfirm(false);
      setPendingFile(null);
    }
  }

  const handleChangeHeader = async (newIndex) => {
    if (!session?.dataset || !originalFileText) return;
    setBusy(true);
    try {
      const lines = originalFileText.split(/\r?\n/).filter(Boolean);
      const sample = lines.slice(newIndex).join("\n");

      const parsed = Papa.parse(sample, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
        transformHeader: (h) => h.trim(),
      });

      const updatedDataset = {
        ...session.dataset,
        headers: parsed.meta.fields || [],
        rows: parsed.data || [],
        headerIndex: newIndex,
        detection: {
          ...(session.dataset.detection || {}),
          headerIndex: newIndex,
          confidence: newIndex === 0 ? "high" : "medium",
        },
      };

      setSession((prev) => ({ ...prev, dataset: updatedDataset }));
    } catch (err) {
      console.error("Failed to change header:", err);
      setError("Failed to update header row");
    } finally {
      setBusy(false);
    }
  };

  const handleConfirmHeader = () => {
    const updatedDataset = { ...(session?.dataset || {}) };
    if (updatedDataset.detection) delete updatedDataset.detection;
    setSession((prev) => ({ ...prev, dataset: updatedDataset }));
  };

  const ds = session?.dataset;

  return (
    <div className="card fade-in relative">
      <h2 className="text-xl font-semibold mb-2">📤 Upload Dataset</h2>
      <p className="text-sm opacity-80 mb-3">
        Upload CSV, Excel, TXT, or DOCX files for analysis.
      </p>

      <input
        ref={inputRef}
        type="file"
        accept=".csv,.xlsx,.xls,.txt,.docx"
        className="block border border-[var(--border)] rounded-lg p-2 w-full text-sm cursor-pointer"
        onChange={handleFile}
      />

      {busy && <p className="mt-2 text-sm text-[var(--brand1)] animate-pulse">Parsing file...</p>}
      {error && <p className="mt-2 text-sm text-red-500">⚠️ {error}</p>}

      {ds?.detection && (
        <HeaderConfirmBanner
          detection={ds.detection}
          headers={ds.headers}
          onChangeHeader={handleChangeHeader}
          onDismiss={handleConfirmHeader}
        />
      )}

      {process.env.NODE_ENV === "development" && ds && (
        <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
          <strong>Debug:</strong> Headers: {ds.headers?.length}, Rows: {ds.rows?.length},{" "}
          Detection: {ds.detection ? "Yes" : "No"}
        </div>
      )}

      {showConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 shadow-xl w-[400px] animate-fade-in">
            <h3 className="text-lg font-semibold mb-2 text-[var(--text)]">Replace existing dataset?</h3>
            <p className="text-sm opacity-80 mb-4">Uploading a new file will replace your current dataset.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => { setShowConfirm(false); setPendingFile(null); }} className="px-4 py-2 text-sm rounded-md border border-[var(--border)] hover:bg-[var(--muted)]">Cancel</button>
              <button onClick={() => processFile(pendingFile)} className="px-4 py-2 text-sm rounded-md bg-red-500 text-white hover:opacity-90">Replace</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}