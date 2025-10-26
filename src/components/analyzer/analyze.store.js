import { create } from "zustand";
import { supabase } from "@/lib/supabase.js";

const API_BASE = import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "/api";

/**
 * 🧠 Helper — always attach Supabase JWT token
 */
async function getAuthHeaders(extra = {}) {
  try {
    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token;
    return token ? { ...extra, Authorization: `Bearer ${token}` } : extra;
  } catch (err) {
    console.warn("⚠️ Supabase session unavailable:", err.message);
    return extra;
  }
}

/**
 * 🧭 SmartDoc Analyze Store (v6.3)
 * Centralized data manager for analysis, schema, and correlations.
 */
export const useAnalyzeStore = create((set, get) => ({
  // 🗂 State
  dataset: null,          // uploaded/scrutinized dataset
  analysis: null,         // analysis result from /analyze
  schema: null,           // inferred schema
  quality: null,          // missing values, duplicates, outliers
  correlations: null,     // correlation matrix
  result: null,           // exploration result (charts/tables)
  query: {
    metric: null,
    groupBy: null,
    splitBy: null,
    chartType: "bar",
    filters: {},
  },
  lastUpdated: null,
  loading: false,
  error: null,

  // 📥 Set dataset (from scrutiny or upload)
  setDataset: (data) =>
    set((state) => {
      if (!data) {
        console.warn("⚠️ setDataset called with empty data");
        return state;
      }

      // detect if backend response includes analysis block
      if (data?.analysis || data?.summary) {
        return {
          ...state,
          analysis: data.analysis || data,
          lastUpdated: data.lastUpdated || new Date().toISOString(),
        };
      }

      const columns = data.columns || data.headers || [];
      const rows = data.rows || data.preview || [];

      if (columns.length && rows.length)
        console.log(`📊 Dataset updated: ${columns.length} columns, ${rows.length} rows`);
      else
        console.warn("⚠️ Dataset structure incomplete:", data);

      // persist locally for reloads
      try {
        localStorage.setItem("smartdoc_dataset", JSON.stringify(data));
      } catch (_) {}

      return { ...state, dataset: data };
    }),

  // 🧠 Set analysis results
  setAnalysis: (result) =>
    set((state) => {
      if (!result) return state;
      console.log("🧠 Analysis updated:", result?.summary || "no summary");
      try {
        localStorage.setItem("smartdoc_analysis", JSON.stringify(result));
      } catch (_) {}
      return { ...state, analysis: result, lastUpdated: new Date().toISOString() };
    }),

  // ⚙️ Update query parameters
  setQuery: (q) => set({ query: { ...get().query, ...q } }),

  // ♻️ Reset explore result
  resetResult: () => set({ result: null }),

  // 🧹 Clear all data (for new uploads)
  clearAll: () => {
    console.log("🧹 Clearing Analyze Store state");
    set({
      dataset: null,
      analysis: null,
      schema: null,
      quality: null,
      correlations: null,
      result: null,
      lastUpdated: null,
      error: null,
    });
    localStorage.removeItem("smartdoc_dataset");
    localStorage.removeItem("smartdoc_analysis");
  },

  // 🔍 Detect schema and data quality
  detectSchemaAndQuality: async () => {
    const { dataset } = get();
    if (!dataset) return console.warn("⚠️ No dataset available for schema detection");
    set({ loading: true, error: null });
    try {
      const headers = await getAuthHeaders({ "Content-Type": "application/json" });
      const res = await fetch(`${API_BASE}/quality`, {
        method: "POST",
        headers,
        body: JSON.stringify({ dataset }),
      });
      if (!res.ok) throw new Error(await res.text());
      const payload = await res.json();
      set({
        schema: payload.structure ?? payload.schema,
        quality: payload.quality,
      });
      console.log("✅ Schema & Quality detected");
    } catch (e) {
      console.error("❌ detectSchemaAndQuality failed:", e);
      set({ error: e.message });
    } finally {
      set({ loading: false });
    }
  },

  // 📊 Explore dataset (grouped metrics)
  runExplore: async () => {
    const { dataset, query } = get();
    if (!dataset || !query?.metric || !query?.groupBy)
      return console.warn("⚠️ runExplore called without valid query/dataset");

    set({ loading: true, error: null });
    try {
      const headers = await getAuthHeaders({ "Content-Type": "application/json" });
      const res = await fetch(`${API_BASE}/explore`, {
        method: "POST",
        headers,
        body: JSON.stringify({ dataset, query }),
      });
      if (!res.ok) throw new Error(await res.text());
      const payload = await res.json();
      set({ result: payload });
      console.log("✅ Exploration complete:", payload);
    } catch (e) {
      console.error("❌ runExplore failed:", e);
      set({ error: e.message });
    } finally {
      set({ loading: false });
    }
  },

  // 🔗 Correlation Analysis
  runCorrelate: async (target, threshold = 0.5) => {
    const { dataset } = get();
    if (!dataset) return console.warn("⚠️ No dataset for correlation");
    set({ loading: true, error: null });
    try {
      const headers = await getAuthHeaders({ "Content-Type": "application/json" });
      const res = await fetch(`${API_BASE}/correlate`, {
        method: "POST",
        headers,
        body: JSON.stringify({ dataset, target, threshold }),
      });
      if (!res.ok) throw new Error(await res.text());
      const payload = await res.json();
      set({ correlations: payload });
      console.log("✅ Correlation complete");
    } catch (e) {
      console.error("❌ runCorrelate failed:", e);
      set({ error: e.message });
    } finally {
      set({ loading: false });
    }
  },

  // 💾 Load from cache (offline mode)
  loadFromCache: (uploadId = null) => {
    try {
      const cachedDataset = localStorage.getItem("smartdoc_dataset");
      const cachedAnalysis = localStorage.getItem("smartdoc_analysis");

      if (cachedDataset) {
        set({ dataset: JSON.parse(cachedDataset) });
        console.log("♻️ Dataset restored from cache");
      }

      if (cachedAnalysis) {
        set({ analysis: JSON.parse(cachedAnalysis) });
        console.log("♻️ Analysis restored from cache");
      }

      if (uploadId)
        console.log(`📦 Cache rehydration for upload: ${uploadId}`);
    } catch (e) {
      console.warn("⚠️ Cache rehydration failed:", e);
    }
  },
}));
