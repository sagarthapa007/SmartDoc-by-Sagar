import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload as UploadIcon, Loader, AlertCircle } from "lucide-react";
import SmartPreviewCard from "@/components/upload/SmartPreviewCard.jsx";
import { useSession } from "@/context/SessionContext.jsx";
import { useAnalyzeStore } from "@/store/analyze.store.js";
import apiClient from "@/lib/apiClient.js";
import { useNavigate } from "react-router-dom";

export default function Upload() {
  const { setSession } = useSession();
  const { setDataset } = useAnalyzeStore();
  const navigate = useNavigate();

  const [file, setFile] = useState(null);
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMsg, setStatusMsg] = useState("");

  // ✅ File selection handler
  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setReport(null);
      setError("");
      setProgress(0);
    }
  };

  // ✅ Upload (includes built-in scrutiny)
  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError("");
    setProgress(0);
    setStatusMsg("Uploading...");

    try {
      const fd = new FormData();
      fd.append("file", file);

      const res = await apiClient.post("upload", fd, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (e) => {
          if (e.total) {
            const percent = Math.round((e.loaded * 100) / e.total);
            setProgress(percent);
            setStatusMsg(`Uploading ${percent}%`);
          }
        },
      });

      const data = res.data;
      console.log("✅ Upload Response:", data);

      // ✅ Save scrutiny directly (no detect step)
      setReport(data);
      setDataset(data.scrutiny);
      setSession((p) => ({ ...p, uploadId: data.upload_id, dataset: data.scrutiny }));
      setProgress(100);
      setStatusMsg("File uploaded & scrutinized successfully ✅");
    } catch (err) {
      console.error("Upload error:", err);
      setError(err.response?.data?.detail || err.message || "Upload failed");
      setStatusMsg("Upload failed ❌");
    } finally {
      setLoading(false);
      setTimeout(() => setStatusMsg(""), 1500);
    }
  };

  // ✅ Confirm and analyze
  const confirmAndAnalyze = async (report) => {
    if (!report?.upload_id) return;
    setLoading(true);
    setStatusMsg("Analyzing data...");

    try {
      const scrutinyPayload = report.scrutiny || report; // 👈 ensure we send scrutiny only
      const res = await apiClient.post("analyze", {
        upload_id: report.upload_id,
        scrutiny: scrutinyPayload,
      });

      console.log("🧠 Analyze Response:", res.data);

      // ✅ Normalize dataset only if not already set
      if (!report.scrutiny && res.data?.scrutiny) {
        // only applies to certain backend responses (rare)
        const scrutiny = res.data.scrutiny;
        const dataset = {
          headers: scrutiny.schema?.map((s) => s.name) || [],
          rows: scrutiny.preview || [],
          meta: {
            filetype: res.data.filetype,
            upload_id: res.data.upload_id,
            filename: res.data.filename,
            filesize_bytes: res.data.filesize_bytes,
          },
        };
        console.log("✅ Normalized dataset from backend scrutiny:", dataset);
        setDataset(dataset);
      } else {
        console.log(
          "ℹ️ Using existing dataset from upload (no re-normalization needed).",
        );
      }

      setSession((p) => ({
        ...p,
        analysis: res.data,
        uploadId: report.upload_id,
      }));

      // ✅ optional: store for history
      sessionStorage.setItem("latest_upload_id", report.upload_id);
      navigate("/analyze");
    } catch (e) {
      console.error("Analyze error:", e);
      setError(e.response?.data?.detail || e.message || "Analysis failed");
      setStatusMsg("Analysis failed ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 flex flex-col items-center p-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Smart Upload Center
        </h1>
        <p className="text-gray-600 text-sm max-w-xl mx-auto">
          Upload CSV, Excel, JSON, DOCX, or PDF — SmartDoc will automatically
          analyze and prepare your data for AI insights.
        </p>
      </motion.div>

      {/* Upload Card */}
      <div
        className={`w-full max-w-3xl border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center ${
          loading
            ? "border-blue-400 bg-blue-50"
            : "border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50/20"
        }`}
      >
        <input
          id="fileInput"
          type="file"
          accept=".csv,.xlsx,.xls,.json,.pdf,.docx"
          onChange={handleFile}
          className="hidden"
        />

        <label
          htmlFor="fileInput"
          className="cursor-pointer flex flex-col items-center"
        >
          {loading ? (
            <Loader className="w-14 h-14 text-blue-600 animate-spin mb-3" />
          ) : (
            <UploadIcon className="w-14 h-14 text-blue-600 mb-3" />
          )}
          <span className="text-lg font-semibold text-gray-800 mb-1">
            {file ? file.name : "Drag or click to upload"}
          </span>
          <span className="text-sm text-gray-500">
            Accepted: CSV, XLSX, JSON, DOCX, PDF
          </span>
        </label>

        <button
          onClick={handleUpload}
          disabled={!file || loading}
          className="mt-6 px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-40"
        >
          {loading ? "Processing..." : "Upload & Scrutinize"}
        </button>

        {error && (
          <div className="mt-3 flex items-center gap-2 text-sm text-red-600">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <AnimatePresence>
        {progress > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-lg bg-white shadow-lg rounded-xl overflow-hidden border border-gray-200"
          >
            <div className="px-4 py-2 text-gray-800 text-sm font-medium">
              {statusMsg}
            </div>
            <div className="h-2 w-full bg-gray-200">
              <motion.div
                className="h-full bg-blue-600"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ ease: "easeOut", duration: 0.2 }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Smart Preview */}
      <div className="mt-8 w-full max-w-5xl">
        <SmartPreviewCard report={report} onConfirm={confirmAndAnalyze} />
      </div>
    </div>
  );
}
