import { create } from "zustand";
import { supabase } from "@/utils/supabaseClient.js";

const API_BASE = import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "/api";

// Helper: always attach Supabase JWT
async function getAuthHeaders(extra = {}) {
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  return token
    ? { ...extra, Authorization: `Bearer ${token}` }
    : extra;
}

export const useAnalyzeStore = create((set, get) => ({
  dataset: null,        // { headers: [], rows: [] }
  schema: null,         // { columns: [{name,type,unique_count,examples:[]}] }
  quality: null,        // { duplicates: {...}, outliers: {...}, missing: {...} }
  query: { metric: null, groupBy: null, splitBy: null, chartType: "bar", filters: {} },
  result: null,         // chart-ready data from backend
  correlations: null,   // { correlations: [...] }
  loading: false,
  error: null,

  setDataset: (ds) => set({ dataset: ds }),
  setQuery: (q) => set({ query: { ...get().query, ...q } }),
  resetResult: () => set({ result: null }),

  // 🧠 Detect schema & data quality (backend call)
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
      set({ schema: payload.structure, quality: payload.quality });
    } catch (e) {
      set({ error: e.message });
      console.error("❌ detectSchemaAndQuality failed:", e);
    } finally {
      set({ loading: false });
    }
  },

  // 📊 Explore data
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
    } catch (e) {
      set({ error: e.message });
      console.error("❌ runCorrelate failed:", e);
    } finally {
      set({ loading: false });
    }
  },
}));
