import React, { useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload as UploadIcon,
  Loader,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import SmartPreviewCard from "@/components/upload/SmartPreviewCard.jsx";
import { useSession } from "@/context/SessionContext.jsx";
import useAnalyzeStore from "@/components/analyzer/analyze.store.js";

const API_URL = import.meta.env.VITE_API_URL;

export default function Upload() {
  const { session, setSession } = useSession();
  const { setDataset } = useAnalyzeStore();
  const [file, setFile] = useState(null);
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setReport(null);
      setError("");
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await axios.post(`${API_URL}/api/upload`, fd);
      setReport(res.data);
      setSession((p) => ({ ...p, uploadId: res.data.upload_id }));
    } catch (e) {
      setError(e.response?.data?.detail || e.message);
    }
    setLoading(false);
  };

  const confirmAndAnalyze = async (report) => {
    if (!report?.upload_id) return;
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/analyze`, {
        upload_id: report.upload_id,
      });
      setDataset(res.data);
      setSession((p) => ({ ...p, analysis: res.data }));
      window.location.href = "/analyze";
    } catch (e) {
      setError(e.response?.data?.detail || e.message);
    }
    setLoading(false);
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
          Upload CSV, Excel, JSON, DOCX, or PDF. SmartDoc will classify and
          prepare it for AI analysis.
        </p>
      </motion.div>

      <div
        className={`w-full max-w-3xl border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center ${loading ? "border-blue-400 bg-blue-50" : "border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50/20"}`}
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
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}
      </div>

      <div className="mt-8 w-full max-w-5xl">
        <SmartPreviewCard report={report} onConfirm={confirmAndAnalyze} />
      </div>

      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium"
          >
            <CheckCircle className="w-4 h-4 inline mr-2" /> Processing...
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
