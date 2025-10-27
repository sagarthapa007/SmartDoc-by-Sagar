import axios from "axios";

let baseUrl = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
if (!baseUrl.endsWith("/api")) {
  baseUrl = baseUrl.replace(/\/+$/, "") + "/api";
}
export const API_URL = baseUrl;

const apiClient = axios.create({
  baseURL: baseUrl,
  timeout: 20000,
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.request.use(
  (config) => {
    try {
      const token = localStorage.getItem("supabase.auth.token");
      if (token) {
        const parsed = JSON.parse(token);
        const accessToken = parsed?.currentSession?.access_token;
        if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
      }
    } catch (err) {
      console.warn("⚠️ Supabase token parse failed:", err);
    }
    return config;
  },
  (error) => Promise.reject(error),
);

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
    if (!error.response)
      normalized.message =
        "Network error — please check your internet connection.";
    else if (error.response.status === 404)
      normalized.message =
        "Endpoint not found — check backend route mapping.";
    else if (error.response.status === 401)
      console.warn("🔒 Unauthorized (401): Supabase session expired?");
    else if (error.response.status >= 500)
      normalized.message = "Server error — please try again later.";
    return Promise.reject(normalized);
  },
);

export default apiClient;
