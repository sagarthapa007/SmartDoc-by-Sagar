/**
 * 🌐 SmartDoc Backend Client
 * Centralized API communication layer between React (frontend) and FastAPI (backend).
 * Handles: upload, analyze, narrate, auth, and future endpoints.
 */

const API_BASE =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "/api";

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

/**
 * 🔄 Upload File
 * Sends structured file data (parsed from ingest.js) to backend.
 */
export async function uploadFile(filePayload) {
  return request("/upload", "POST", filePayload);
}

/**
 * 📊 Analyze Data
 * Sends JSON-structured table data to backend for statistical analysis.
 */
export async function analyzeData(data) {
  return request("/analyze", "POST", data);
}

/**
 * 🧠 Generate Narrative Summary
 */
export async function generateNarrative(data) {
  return request("/narrate", "POST", data);
}

/**
 * 👤 Auth Operations
 */
export async function login(credentials) {
  return request("/auth/login", "POST", credentials);
}

export async function register(userData) {
  return request("/auth/register", "POST", userData);
}

export async function refreshToken() {
  return request("/auth/refresh", "POST", null, true);
}

/**
 * 🩺 Health Check
 */
export async function healthCheck() {
  return request("/health", "GET");
}

/**
 * 🚨 Offline Fallbacks
 * Used when backend is unreachable (e.g., dev mode or offline).
 */
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

export default {
  uploadFile,
  analyzeData,
  generateNarrative,
  login,
  register,
  refreshToken,
  healthCheck,
  offlineFallbacks,
};
