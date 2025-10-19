/**
 * 🌐 SmartDoc Backend Client (G4+ Unified)
 * Centralized API communication layer between React (frontend) and FastAPI (backend).
 * Handles: upload, detect, analyze, explore, actions, narrate, auth, and offline fallbacks.
 */

const API_BASE =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "/api";

/**
 * Universal request wrapper with auth and JSON handling
 */
async function request(endpoint, method = "GET", data = null, auth = false) {
  const url = `${API_BASE}${endpoint}`;
  const headers = { "Content-Type": "application/json" };

  // Attach JWT token if required
  if (auth) {
    const token = localStorage.getItem("smartdoc_token");
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const options = { method, headers };
  if (data) options.body = JSON.stringify(data);

  try {
    const res = await fetch(url, options);
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || res.statusText);
    return json;
  } catch (error) {
    console.error(`❌ [BackendClient] ${method} ${endpoint} failed:`, error);
    return { success: false, error: error.message };
  }
}

/* =========================================================
   🔄 FILE UPLOAD & ANALYSIS
   ========================================================= */

/**
 * 📤 Upload File
 * Sends structured file data (parsed from ingest.js or upload component) to backend.
 */
export async function uploadFile(filePayload) {
  return request("/upload", "POST", filePayload);
}

/**
 * 🧭 Detect Data Type (Auto Context)
 * Determines dataset type and suggests relevant analyses.
 */
export async function detectData(dataset) {
  return request("/detect", "POST", {
    headers: dataset.headers,
    sample_rows: dataset.rows?.slice(0, 100) || [],
    text_blocks: dataset.text_blocks || [],
  });
}

/**
 * 📊 Analyze Data (Persona + Domain aware)
 * Sends dataset with context to backend for statistical analysis.
 */
export async function analyzeData(data, context = { persona: "manager", data_type: "generic_dataset" }) {
  return request("/analyze", "POST", {
    headers: data.headers,
    rows: data.rows || [],
    text_blocks: data.text_blocks || [],
    context,
  });
}

/**
 * 🧠 Generate Narrative Summary (Legacy / Optional)
 */
export async function generateNarrative(data) {
  return request("/narrate", "POST", data);
}

/* =========================================================
   ⚙️ ACTIONABLE OPERATIONS
   ========================================================= */

/**
 * 🧩 Perform Backend Actions (deduplicate, fill_missing, remove_outliers, export)
 */
export async function performAction(action, payload) {
  return request(`/actions/${action}`, "POST", payload);
}

/* =========================================================
   🔍 EXPLORE API (No-SQL Query Builder)
   ========================================================= */

/**
 * 🔍 Explore Query
 * Allows filters, group_by, aggregates, and returns SQL equivalent.
 */
export async function exploreQuery(dataset_id, query) {
  return request("/explore", "POST", { dataset_id, query });
}

/* =========================================================
   👤 AUTHENTICATION
   ========================================================= */

export async function login(credentials) {
  return request("/auth/login", "POST", credentials);
}

export async function register(userData) {
  return request("/auth/register", "POST", userData);
}

export async function refreshToken() {
  return request("/auth/refresh", "POST", null, true);
}

/* =========================================================
   🩺 HEALTH CHECK
   ========================================================= */
export async function healthCheck() {
  return request("/health", "GET");
}

/* =========================================================
   🚨 OFFLINE FALLBACKS
   ========================================================= */

export const offlineFallbacks = {
  analyzeLocally: async (data) => {
    console.warn("⚠️ Backend unreachable — using local analyzer.");
    const { analyze } = await import("@utils/analyze.js");
    return { success: true, result: analyze(data) };
  },
  narrateLocally: async (data) => {
    console.warn("⚠️ Backend unreachable — using local summarizer.");
    const { generateNarrative: localSummarizer } = await import("@utils/insightEngine.js");
    return { success: true, summary: localSummarizer(data) };
  },
};

/* =========================================================
   📦 DEFAULT EXPORT
   ========================================================= */

export default {
  uploadFile,
  detectData,
  analyzeData,
  generateNarrative,
  performAction,
  exploreQuery,
  login,
  register,
  refreshToken,
  healthCheck,
  offlineFallbacks,
};
/**-------------------------Frontend for Chart Suggestions  */
export async function suggestCharts(payload) {
  return request("/intelligence/suggest_charts", "POST", payload);
}
export async function explainQuestion(payload) {
  return request("/intelligence/explain", "POST", payload);
}
