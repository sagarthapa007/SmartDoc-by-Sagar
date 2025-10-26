// ======================================================
// 🌐 SmartDoc Enterprise - Universal API Client (v6.3)
// ------------------------------------------------------
// Handles:
//  ✅ Base URL detection (local vs cloud)
//  ✅ /api prefix normalization
//  ✅ Auto-inject Supabase tokens
//  ✅ Centralized error normalization for FastAPI backend
// ======================================================

import axios from "axios";

// 🧠 1️⃣ Detect environment base URL
let baseUrl = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

// 🧩 Ensure /api prefix (avoid double slashes)
if (!baseUrl.endsWith("/api")) {
  baseUrl = baseUrl.replace(/\/+$/, "") + "/api";
}

// 🚀 Export for use elsewhere
export const API_URL = baseUrl;

// 🛠️ 2️⃣ Axios instance
const apiClient = axios.create({
  baseURL: baseUrl,
  timeout: 20000, // 20s timeout for slow PDF/DOCX reads
  headers: { "Content-Type": "application/json" },
});

// 🔐 3️⃣ Optional: attach Supabase token automatically
apiClient.interceptors.request.use(
  (config) => {
    try {
      const token = localStorage.getItem("supabase.auth.token");
      if (token) {
        const parsed = JSON.parse(token);
        const accessToken = parsed?.currentSession?.access_token;
        if (accessToken) {
          config.headers.Authorization = `Bearer ${accessToken}`;
        }
      }
    } catch (err) {
      console.warn("⚠️ Supabase token parse failed:", err);
    }

    // Ensure endpoint URLs are clean (no double `/api/api`)
    if (config.url?.startsWith("/")) {
      config.url = config.url.replace(/^\/+/, "");
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ⚡ 4️⃣ Global error normalization
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const normalized = {
      url: error.config?.url,
      status: error.response?.status,
      message:
        error.response?.data?.detail ||
        error.response?.data?.message ||
        error.message ||
        "Unknown error occurred.",
    };

    console.error("❌ API Error:", normalized);

    if (!error.response) {
      normalized.message =
        "Network error — please check your internet connection.";
    } else if (error.response.status === 404) {
      normalized.message = "Endpoint not found — check backend route mapping.";
    } else if (error.response.status === 401) {
      console.warn("🔒 Unauthorized (401): Supabase session expired?");
    } else if (error.response.status >= 500) {
      normalized.message = "Server error — please try again later.";
    }

    return Promise.reject(normalized);
  }
);

export default apiClient;
