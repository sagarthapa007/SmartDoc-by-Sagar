import React, { useState } from "react";
import UploaderPanel from "@components/upload/UploaderPanel";
import StatCards from "@components/analyzer/StatCards";
import PreviewTable from "@components/analyzer/PreviewTable";
import { useSession } from "@context/SessionContext.jsx";
import { uploadFile, offlineFallbacks } from "@utils/backendClient.js";

/**
 * 📤 Upload Page — Enterprise Dual Panel Layout (Backend-Connected)
 * - Local CSV parsing + backend ingestion
 * - Auto fallback when backend unavailable
 * - Preserves all UI, KPIs, and Preview layout
 */
export default function Upload() {
  const { session, setSession, setRoute } = useSession();
  const ds = session?.dataset;
  const hasData = ds && ds.headers && ds.rows;
  const [uploading, setUploading] = useState(false);

  // 🚀 Handler when file parsed in UploaderPanel
  const handleFileProcessed = async (parsedData) => {
    setUploading(true);
    console.log("📦 File parsed locally:", parsedData);

    try {
      // Send dataset to backend for deeper ingestion / preview caching
      const backendRes = await uploadFile(parsedData);

      if (backendRes?.success) {
        console.log("✅ Backend ingestion complete:", backendRes);
        setSession({ ...session, dataset: backendRes.data || parsedData });
      } else {
        console.warn("⚠️ Backend unavailable — using local dataset.");
        setSession({ ...session, dataset: parsedData });
      }
    } catch (err) {
      console.error("❌ Upload failed:", err);
      setSession({ ...session, dataset: parsedData });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-96px)] overflow-hidden bg-[var(--background)] text-[var(--text)]">
      
      {/* === Top Section: Upload + KPIs === */}
      <div className="flex-none space-y-4 px-6 pt-4 pb-2 border-b border-[var(--border)]">
        <UploaderPanel onFileProcessed={handleFileProcessed} />
        {hasData && <StatCards headers={ds.headers} rows={ds.rows} />}
      </div>

      {/* === Bottom Section: Scrollable Preview === */}
      <div className="flex-1 overflow-auto px-6 pb-4 scrollbar-thin scrollbar-track-[var(--background)] scrollbar-thumb-[var(--border)]">
        {uploading ? (
          <div className="flex flex-col h-full items-center justify-center text-center p-8 animate-pulse">
            <div className="text-6xl mb-4 opacity-40">⏳</div>
            <h3 className="text-lg font-medium text-[var(--text-strong)] mb-2">
              Uploading to SmartDoc Engine...
            </h3>
            <p className="text-sm text-[var(--text-muted)]">
              Please wait — syncing with backend server.
            </p>
          </div>
        ) : hasData ? (
          <div className="card fade-in animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-[var(--text-strong)]">
                  Data Preview
                </h3>
                <p className="text-sm text-[var(--text-muted)] mt-1">
                  Showing first 20 rows of {ds.rows.length.toLocaleString()} total
                </p>
              </div>
              <button
                onClick={() => setRoute("analyze")}
                className="btn btn-primary flex items-center gap-2 transition-all hover:scale-105"
                aria-label="Analyze dataset"
              >
                <span className="text-lg">🔍</span>
                Analyze Data
              </button>
            </div>

            {/* ✅ Preview rows with enhanced loading state */}
            <PreviewTable
              headers={ds.headers}
              rows={ds.rows.slice(0, 20)}
              maxHeight="400px"
            />
            
            {/* Dataset summary footer */}
            <div className="flex justify-between items-center mt-4 pt-3 border-t border-[var(--border)] text-sm text-[var(--text-muted)]">
              <span>
                {ds.headers.length} columns × {ds.rows.length.toLocaleString()} rows
              </span>
              {ds.rows.length > 20 && (
                <span>
                  +{ds.rows.length - 20} more rows available
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col h-full items-center justify-center text-center p-8">
            <div className="text-6xl mb-4 opacity-50">📊</div>
            <h3 className="text-lg font-medium text-[var(--text-strong)] mb-2">
              No Dataset Loaded
            </h3>
            <p className="text-sm text-[var(--text-muted)] max-w-md">
              Upload a CSV, Excel, or JSON file to begin analysis. 
              Your data will preview here automatically.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
