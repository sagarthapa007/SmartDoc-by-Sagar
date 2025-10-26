import { create } from "zustand";
import { supabase } from "@/utils/supabaseClient.js";

const API_BASE = import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "/api";

// ✅ Helper — always attach Supabase JWT
async function getAuthHeaders(extra = {}) {
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  return token ? { ...extra, Authorization: `Bearer ${token}` } : extra;
}

/**
 * 🧠 SmartDoc Analyze Store (v6.3 unified)
 * Handles:
 *  - dataset (from upload/scrutiny)
 *  - analysis (from backend /analyze)
 *  - correlations, exploration, schema, and quality
 */
export const useAnalyzeStore = create((set, get) => ({
  dataset: null,        // from scrutiny/upload
  analysis: null,       // from /analyze API
  schema: null,         // column-level info
  quality: null,        // missing/duplicates/outliers
  correlations: null,   // correlation matrix
  result: null,         // exploration result
  query: { metric: null, groupBy: null, splitBy: null, chartType: "bar", filters: {} },
  lastUpdated: null,
  loading: false,
  error: null,

  // ✅ Unified dataset setter
  setDataset: (data) =>
    set((state) => {
      if (data?.analysis || data?.summary) {
        // Merge analysis into existing dataset
        return {
          ...state,
          analysis: data.analysis || data,
          lastUpdated: data.lastUpdated || new Date().toISOString(),
        };
      }
      return { ...state, dataset: data };
    }),

  // ✅ Separate analysis setter
  setAnalysis: (result) =>
    set((state) => ({
      ...state,
      analysis: result,
      lastUpdated: new Date().toISOString(),
    })),

  // ✅ Update query
  setQuery: (q) => set({ query: { ...get().query, ...q } }),

  // ✅ Reset exploration result
  resetResult: () => set({ result: null }),

  // ✅ Clear all data (for new uploads)
  clearAll: () => set({
    dataset: null,
    analysis: null,
    schema: null,
    quality: null,
    correlations: null,
    result: null,
    lastUpdated: null,
    error: null
  }),

  // 🧩 Detect schema + data quality
  detectSchemaAndQuality: async () => {
    const { dataset } = get();
    if (!dataset) return;
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
      set({ schema: payload.structure ?? payload.schema, quality: payload.quality });
    } catch (e) {
      set({ error: e.message });
      console.error("❌ detectSchemaAndQuality failed:", e);
    } finally {
      set({ loading: false });
    }
  },

  // 📊 Explore dataset
  runExplore: async () => {
    const { dataset, query } = get();
    if (!dataset || !query?.metric || !query?.groupBy) return;
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
      set({ error: e.message });
      console.error("❌ runExplore failed:", e);
    } finally {
      set({ loading: false });
    }
  },

  // 🔗 Correlation analysis
  runCorrelate: async (target, threshold = 0.5) => {
    const { dataset } = get();
    if (!dataset) return;
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
      set({ error: e.message });
      console.error("❌ runCorrelate failed:", e);
    } finally {
      set({ loading: false });
    }
  },

  // 💾 Rehydrate analysis from cache (offline mode)
  loadFromCache: (uploadId) => {
    try {
      const cached = localStorage.getItem(`analysis_${uploadId}`);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        set({
          analysis: data,
          lastUpdated: timestamp,
        });
        console.log("♻️ Loaded cached analysis:", uploadId);
      }
    } catch (e) {
      console.warn("Cache load failed:", e);
    }
  },
}));
