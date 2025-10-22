import React, { useEffect, useRef, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ingestFile } from "@/utils/ingest";
import { useSession } from "@context/SessionContext";
import HeaderConfirmBanner from "./HeaderConfirmBanner";
import { useAnalyzeStore } from "@/store/analyze.store.js";
import Papa from "papaparse";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Upload as UploadIcon, 
  FileText, 
  Table, 
  CheckCircle, 
  AlertCircle,
  Loader,
  BarChart3,
  X,
  Smartphone,
  Image,
  File,
  FileCode,
  Database,
  Presentation
} from "lucide-react";

// Universal file type support
const SUPPORTED_FORMATS = {
  // Data Files
  '.csv': { type: 'data', icon: Database, color: 'text-green-600', label: 'CSV Data' },
  '.xlsx': { type: 'data', icon: Table, color: 'text-green-600', label: 'Excel Spreadsheet' },
  '.xls': { type: 'data', icon: Table, color: 'text-green-600', label: 'Excel Spreadsheet' },
  '.json': { type: 'data', icon: FileCode, color: 'text-yellow-600', label: 'JSON Data' },
  '.xml': { type: 'data', icon: FileCode, color: 'text-yellow-600', label: 'XML Data' },
  
  // Documents
  '.docx': { type: 'document', icon: FileText, color: 'text-blue-600', label: 'Word Document' },
  '.doc': { type: 'document', icon: FileText, color: 'text-blue-600', label: 'Word Document' },
  '.pdf': { type: 'document', icon: FileText, color: 'text-red-600', label: 'PDF Document' },
  '.txt': { type: 'document', icon: FileText, color: 'text-gray-600', label: 'Text File' },
  '.rtf': { type: 'document', icon: FileText, color: 'text-blue-600', label: 'Rich Text' },
  
  // Presentations
  '.pptx': { type: 'presentation', icon: Presentation, color: 'text-orange-600', label: 'PowerPoint' },
  '.ppt': { type: 'presentation', icon: Presentation, color: 'text-orange-600', label: 'PowerPoint' },
  
  // Images (for OCR potential)
  '.jpg': { type: 'image', icon: Image, color: 'text-purple-600', label: 'JPEG Image' },
  '.jpeg': { type: 'image', icon: Image, color: 'text-purple-600', label: 'JPEG Image' },
  '.png': { type: 'image', icon: Image, color: 'text-purple-600', label: 'PNG Image' },
  '.gif': { type: 'image', icon: Image, color: 'text-purple-600', label: 'GIF Image' },
  '.bmp': { type: 'image', icon: Image, color: 'text-purple-600', label: 'Bitmap Image' },
  '.svg': { type: 'image', icon: Image, color: 'text-purple-600', label: 'SVG Image' },
  
  // Archives (for extraction)
  '.zip': { type: 'archive', icon: File, color: 'text-indigo-600', label: 'ZIP Archive' },
  '.rar': { type: 'archive', icon: File, color: 'text-indigo-600', label: 'RAR Archive' },
  '.7z': { type: 'archive', icon: File, color: 'text-indigo-600', label: '7-Zip Archive' },
  
  // Other documents
  '.odt': { type: 'document', icon: FileText, color: 'text-blue-600', label: 'OpenDocument Text' },
  '.ods': { type: 'data', icon: Table, color: 'text-green-600', label: 'OpenDocument Spreadsheet' },
  '.odp': { type: 'presentation', icon: Presentation, color: 'text-orange-600', label: 'OpenDocument Presentation' }
};

const ALL_EXTENSIONS = Object.keys(SUPPORTED_FORMATS);
const ACCEPT_ATTRIBUTE = ALL_EXTENSIONS.join(',');

export default function UploaderPanel() {
  const { session, setSession } = useSession();
  const navigate = useNavigate();
  const location = useLocation();
  const { setDataset } = useAnalyzeStore();
  
  // 🔧 FIX: Store setSession in a ref so it's always available
  const setSessionRef = useRef(setSession);
  
  // Update the ref when setSession changes
  useEffect(() => {
    setSessionRef.current = setSession;
  }, [setSession]);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);
  const [originalFileText, setOriginalFileText] = useState(null);
  const [showHeaderEdit, setShowHeaderEdit] = useState(false);
  const [toast, setToast] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingStage, setProcessingStage] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef(null);

  // Auto-open file picker when navigated from another page
  useEffect(() => {
    if (location?.state?.autoOpen && inputRef.current) {
      const t = setTimeout(() => inputRef.current?.click(), 300);
      return () => clearTimeout(t);
    }
  }, [location?.state?.autoOpen]);

  // Get file type information
  const getFileTypeInfo = (filename) => {
    const extension = filename.toLowerCase().match(/\.[^.]+$/)?.[0] || '';
    return SUPPORTED_FORMATS[extension] || { 
      type: 'unknown', 
      icon: File, 
      color: 'text-gray-600', 
      label: 'Unknown File' 
    };
  };

  // 🔧 FIX: Use useCallback for processFile to maintain reference
  const processFile = useCallback(async (file) => {
    if (!file) return;
    
    console.log('🔄 processFile started, setSessionRef:', !!setSessionRef.current);
    
    if (!setSessionRef.current) {
      setError("Session context not available");
      return;
    }

    setBusy(true);
    setError("");
    setUploadProgress(0);
    setProcessingStage("Initializing...");

    try {
      // Use the ref instead of the hook variable
      setSessionRef.current((prev) => {
        console.log('🔄 Setting session dataset to null');
        return { ...prev, dataset: null };
      });
      
      await new Promise((res) => setTimeout(res, 150));

      setUploadProgress(20);
      setProcessingStage("Reading file...");

      // Store original text for CSV files for header reprocessing
      const fileExt = file.name.toLowerCase();
      if (fileExt.endsWith('.csv') || fileExt.endsWith('.txt')) {
        const text = await file.text();
        setOriginalFileText(text);
      } else {
        setOriginalFileText(null);
      }

      setUploadProgress(60);
      setProcessingStage("Analyzing content...");

      // Process file with enhanced ingest
      const result = await ingestFile(file);
      
      setUploadProgress(80);
      setProcessingStage("Preparing preview...");

      // Enhanced result with file type info
      const enhancedResult = {
        ...result,
        fileType: getFileTypeInfo(file.name),
        originalName: file.name,
        uploadTime: new Date().toISOString()
      };

      console.log('✅ File processed, setting session with dataset');

      // Use the ref
      setSessionRef.current((prev) => {
        const newSession = { ...prev, dataset: enhancedResult };
        console.log('🔄 Session updated with dataset');
        return newSession;
      });
      // ✅ Also push to Analyze Store for the /analyze page
setDataset(enhancedResult);
console.log('✅ Dataset stored in Analyze Store');

// ✅ Optional: Auto-navigate to Analyze after upload
navigate("/analyze");

      
      setUploadProgress(100);
      setProcessingStage("Complete!");

      // Show success toast
      setToast(`✅ Successfully loaded ${file.name}`);
      setTimeout(() => setToast(""), 3000);

    } catch (err) {
      console.error("❌ Upload failed:", err);
      
      let errorMessage = "Failed to process file. ";
      if (err.message.includes("Unsupported file type")) {
        errorMessage += "This file type requires additional processing capabilities.";
      } else if (err.message.includes("corrupted")) {
        errorMessage += "The file appears to be corrupted or in an unexpected format.";
      } else if (err.message.includes("size")) {
        errorMessage += "File is too large for processing.";
      } else {
        errorMessage += "Please try a different file or format.";
      }
      
      setError(errorMessage);
      
      // Error toast
      setToast("❌ Failed to process file");
      setTimeout(() => setToast(""), 3000);
    } finally {
      setBusy(false);
      setUploadProgress(0);
      setProcessingStage("");
      setShowConfirm(false);
      setPendingFile(null);
    }
  }, []);

  const handleFileInput = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Enhanced file size limits based on type
    const fileTypeInfo = getFileTypeInfo(file.name);
    const isMobile = window.innerWidth < 768;
    
    let maxSize = 10 * 1024 * 1024; // Default 10MB
    if (fileTypeInfo.type === 'image') maxSize = 5 * 1024 * 1024; // 5MB for images
    if (fileTypeInfo.type === 'archive') maxSize = 20 * 1024 * 1024; // 20MB for archives
    if (isMobile) maxSize = Math.min(maxSize, 5 * 1024 * 1024); // 5MB max on mobile

    if (file.size > maxSize) {
      setError(`❌ File too large. Maximum size: ${Math.round(maxSize / 1024 / 1024)}MB`);
      return;
    }

    // Check if we need to confirm replacement
    if (session?.dataset) {
      setPendingFile(file);
      setShowConfirm(true);
      return;
    }

    await processFile(file);
  };

  // Drag and drop handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      const file = files[0];
      
      // File size validation for drag & drop
      const fileTypeInfo = getFileTypeInfo(file.name);
      const isMobile = window.innerWidth < 768;
      let maxSize = 10 * 1024 * 1024;
      if (fileTypeInfo.type === 'image') maxSize = 5 * 1024 * 1024;
      if (fileTypeInfo.type === 'archive') maxSize = 20 * 1024 * 1024;
      if (isMobile) maxSize = Math.min(maxSize, 5 * 1024 * 1024);

      if (file.size > maxSize) {
        setError(`❌ File too large. Maximum size: ${Math.round(maxSize / 1024 / 1024)}MB`);
        return;
      }

      if (session?.dataset) {
        setPendingFile(file);
        setShowConfirm(true);
      } else {
        processFile(file);
      }
    }
  };

  // 🔧 FIX: Change header row manually (for CSV/TXT files)
  const handleChangeHeader = useCallback(async (newIndex) => {
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
          confidence: "high",
          confirmed: true,
        },
      };
      
      // Use the ref
      setSessionRef.current((prev) => ({
        ...prev,
        dataset: updatedDataset
      }));
      
      setToast("✅ Header row updated");
      setTimeout(() => setToast(""), 2000);
      
    } catch (err) {
      console.error("Failed to change header:", err);
      setError("Failed to update header row");
    } finally {
      setBusy(false);
    }
  }, [session, originalFileText]);

  // 🔧 FIX: Confirm header and hide banner
  const handleConfirmHeader = useCallback(() => {
    setSessionRef.current((prev) => ({
      ...prev,
      dataset: {
        ...prev.dataset,
        detection: {
          ...(prev.dataset?.detection || {}),
          confirmed: true,
        },
      },
    }));
    setToast("✅ Header confirmed");
    setTimeout(() => setToast(""), 2000);
  }, []);

  const handleAnalyze = () => {
    if (!session?.dataset) return;
    navigate("/analyze");
  };

  const getMessageIcon = () => {
    switch (message.type) {
      case "success": return <CheckCircle className="w-4 h-4" />;
      case "error": return <AlertCircle className="w-4 h-4" />;
      case "warning": return <AlertCircle className="w-4 h-4" />;
      case "info": return <Loader className="w-4 h-4 animate-spin" />;
      default: return null;
    }
  };

  const getMessageColor = () => {
    switch (message.type) {
      case "success": return "text-green-600 bg-green-50 border-green-200";
      case "error": return "text-red-600 bg-red-50 border-red-200";
      case "warning": return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "info": return "text-blue-600 bg-blue-50 border-blue-200";
      default: return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  // Render file type icon
  const renderFileTypeIcon = (filename, size = "w-6 h-6") => {
    const fileTypeInfo = getFileTypeInfo(filename);
    const IconComponent = fileTypeInfo.icon;
    return <IconComponent className={`${size} ${fileTypeInfo.color}`} />;
  };

  const ds = session?.dataset;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 p-3 sm:p-4 safe-area-inset">
      {/* Safe area for mobile devices */}
      <div className="pt-[env(safe-area-inset-top)]"></div>
      
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6 sm:mb-8"
        >
          <div className="flex items-center justify-center gap-2 mb-2 sm:hidden">
            <Smartphone className="w-5 h-5 text-blue-600" />
            <span className="text-sm text-blue-600 font-medium">Mobile Mode</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 px-2">
            Universal Document Upload
          </h1>
          <p className="text-gray-600 text-sm sm:text-base max-w-2xl mx-auto px-4">
            Upload any document type - spreadsheets, presentations, PDFs, images, and more
          </p>
        </motion.div>

        {/* Upload Area */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-6 sm:mb-8"
        >
          <div
            className={`
              border-2 border-dashed rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-12 
              flex flex-col items-center justify-center 
              transition-all duration-200 cursor-pointer
              ${dragActive ? 'border-blue-400 bg-blue-100/50' : 
                busy ? 'border-blue-400 bg-blue-50/50' : 
                'border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50/30'
              }
              shadow-sm hover:shadow-md touch-manipulation
              min-h-[200px] sm:min-h-[280px]
            `}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => !busy && inputRef.current?.click()}
          >
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPT_ATTRIBUTE}
              onChange={handleFileInput}
              className="hidden"
              disabled={busy}
            />
            
            <div className="text-center w-full">
              <div className="relative mb-3 sm:mb-4">
                {busy ? (
                  <Loader className="w-12 h-12 sm:w-16 sm:h-16 text-blue-600 animate-spin mx-auto" />
                ) : (
                  <UploadIcon className="w-12 h-12 sm:w-16 sm:h-16 text-blue-600 mx-auto" />
                )}
                
                {busy && uploadProgress > 0 && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-xs sm:text-sm font-semibold text-blue-600">
                      {uploadProgress}%
                    </div>
                  </div>
                )}
              </div>

              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 px-2">
                {busy ? "Processing..." : "Drag & Drop or Click to Upload"}
              </h3>
              
              <p className="text-gray-500 text-xs sm:text-sm mb-4 px-2 leading-relaxed">
                {busy ? processingStage : "Supports 30+ file types • Max 10MB"}
              </p>

              {!busy && (
                <button
                  className="px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white rounded-lg sm:rounded-xl font-semibold hover:bg-blue-700 transition-colors text-sm sm:text-base touch-manipulation active:scale-95"
                  onClick={(e) => {
                    e.stopPropagation();
                    inputRef.current?.click();
                  }}
                >
                  Choose Files
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Error Display */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4 sm:mb-6 p-3 sm:p-4 rounded-xl border border-red-200 bg-red-50 text-red-600 flex items-start gap-3 text-sm sm:text-base"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span className="flex-1 leading-tight">{error}</span>
              <button
                onClick={() => setError("")}
                className="text-red-400 hover:text-red-600 flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* File Info & Header Banner */}
        {ds && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-white rounded-xl sm:rounded-2xl shadow-lg overflow-hidden"
          >
            {/* File Header */}
            <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-4 sm:p-6 text-white">
              <div className="flex items-start sm:items-center justify-between gap-2">
                <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
                  {renderFileTypeIcon(ds.originalName || ds.meta?.name, "w-5 h-5 sm:w-6 sm:h-6")}
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg sm:text-xl font-semibold truncate">
                      {ds.originalName || ds.meta?.name}
                    </h3>
                    <p className="text-blue-100 text-xs sm:text-sm">
                      {ds.fileType?.label || 'Document'} • 
                      {ds.rows ? ` ${ds.rows.length.toLocaleString()} rows` : ' Content extracted'} • 
                      {ds.headers ? ` ${ds.headers.length} columns` : ''}
                    </p>
                  </div>
                </div>
                <div className="text-blue-100 text-xs flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  <span>{ds.fileType?.type.toUpperCase()}</span>
                </div>
              </div>
            </div>

            {/* Header Confirmation Banner */}
            {ds.detection && !ds.detection.confirmed && !showHeaderEdit && (
              <div className="p-4 border-b border-gray-200">
                <HeaderConfirmBanner
                  detection={ds.detection}
                  headers={ds.headers}
                  onChangeHeader={handleChangeHeader}
                  onDismiss={handleConfirmHeader}
                />
              </div>
            )}

            {/* Data Preview (for tabular data) */}
            {ds.rows && ds.rows.length > 0 && (
              <div className="p-4 border-b border-gray-200">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-xs sm:text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        {ds.headers.slice(0, 6).map((h) => (
                          <th key={h} className="px-2 sm:px-4 py-2 text-left font-semibold text-gray-900 border-b border-gray-200 whitespace-nowrap">
                            <div className="truncate max-w-[120px] sm:max-w-none" title={h}>
                              {h}
                            </div>
                          </th>
                        ))}
                        {ds.headers.length > 6 && (
                          <th className="px-2 sm:px-4 py-2 text-left font-semibold text-gray-900 border-b border-gray-200">
                            +{ds.headers.length - 6} more
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {ds.rows.slice(0, 5).map((row, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          {ds.headers.slice(0, 6).map((header, j) => (
                            <td key={j} className="px-2 sm:px-4 py-2 text-gray-700 whitespace-nowrap">
                              <div className="truncate max-w-[120px] sm:max-w-[200px]" title={String(row[header] || '')}>
                                {row[header] ?? <span className="text-gray-400 italic">null</span>}
                              </div>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Action Footer */}
            <div className="p-4 sm:p-6 bg-gray-50">
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-between items-center">
                <div className="text-xs sm:text-sm text-gray-600 text-center sm:text-left">
                  Ready for AI-powered analysis and insights
                </div>
                <div className="flex gap-2">
                  {/* Edit Header Button */}
                  {ds.headers && (
                    <button
                      onClick={() => setShowHeaderEdit(!showHeaderEdit)}
                      className="px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      ⚙️ Edit Headers
                    </button>
                  )}
                  <button
                    onClick={handleAnalyze}
                    className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-lg sm:rounded-xl hover:opacity-90 transition-opacity shadow-lg text-sm sm:text-base"
                  >
                    <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />
                    Analyze →
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Header Edit Modal */}
        <AnimatePresence>
          {showHeaderEdit && ds?.detection && (
            <div className="mb-6">
              <HeaderConfirmBanner
                detection={ds.detection}
                headers={ds.headers}
                onChangeHeader={(idx) => {
                  handleChangeHeader(idx);
                  setShowHeaderEdit(false);
                }}
                onDismiss={() => setShowHeaderEdit(false)}
              />
            </div>
          )}
        </AnimatePresence>

        {/* Toast Notification */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg z-50 text-sm font-medium"
            >
              {toast}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Replace Confirmation Modal */}
        <AnimatePresence>
          {showConfirm && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
                onClick={() => setShowConfirm(false)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-xl z-50 w-[90vw] max-w-md p-6"
              >
                <h3 className="text-lg font-semibold mb-2">Replace Current File?</h3>
                <p className="text-gray-600 mb-4 text-sm">
                  You already have a file loaded. Uploading a new file will replace it.
                </p>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setShowConfirm(false)}
                    className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => processFile(pendingFile)}
                    className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600"
                  >
                    Replace
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Supported Formats Info */}
        {!ds && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {Object.entries(SUPPORTED_FORMATS).slice(0, 8).map(([ext, info]) => {
              const IconComponent = info.icon;
              return (
                <div key={ext} className="text-center p-4 bg-white rounded-xl shadow-sm border border-gray-100">
                  <IconComponent className={`w-6 h-6 ${info.color} mx-auto mb-2`} />
                  <div className="text-xs font-medium text-gray-900">{info.label}</div>
                  <div className="text-xs text-gray-500">{ext}</div>
                </div>
              );
            })}
          </motion.div>
        )}
      </div>
    </div>
  );
}