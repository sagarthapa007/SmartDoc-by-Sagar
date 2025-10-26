// src/components/analyzer/analyze.store.js
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { supabase } from "@/lib/supabase.js";

const API_BASE = import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "/api";

// Helper: attach Supabase JWT if available
async function getAuthHeaders(extra = {}) {
  try {
    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token;
    return token ? { ...extra, Authorization: `Bearer ${token}` } : extra;
  } catch {
    return extra;
  }
}

// Normalize diverse dataset shapes from different endpoints
function normalizeDataset(ds) {
  if (!ds) return null;
  if (ds.scrutiny) return ds.scrutiny;       // /upload response
  if (ds.analysis) return ds.analysis;       // /analyze response
  if (Array.isArray(ds.preview)) return ds;  // raw from file_scrutinizer
  return ds;
}

export const useAnalyzeStore = create(
  persist(
    (set, get) => ({
      // ---- Core state ----
      dataset: null,           // { headers: [], rows: [] } or compatible
      analysis: null,          // analysis result from /analyze
      schema: null,            // inferred schema
      quality: null,           // quality metrics
      correlations: null,      // correlation matrix / result
      result: null,            // explore result
      domain: null,            // detected domain
      suggestedCharts: [],     // suggested charts list
      insights: [],            // NL insights
      query: {
        metric: null,
        groupBy: null,
        splitBy: null,
        chartType: "bar",
        filters: {},
      },

      // ---- UI state ----
      loading: false,
      error: null,
      lastUpdated: null,

      // ---- Setters ----
      setDataset: (ds) => {
        const normalized = normalizeDataset(ds);
        const columns =
          normalized?.headers ?? normalized?.columns ?? normalized?.columns_detected ?? [];
        const rows =
          normalized?.rows ?? normalized?.preview ?? normalized?.rows_detected ?? [];

        if (columns.length && rows.length) {
          console.log(`📊 Dataset updated: ${columns.length} columns, ${rows.length} rows`);
        } else {
          console.warn("⚠️ Dataset structure incomplete:", normalized);
        }

        try {
          localStorage.setItem("smartdoc_dataset", JSON.stringify(normalized));
        } catch {}
        set({ dataset: normalized, lastUpdated: new Date().toISOString() });
      },

      setAnalysis: (result) => {
        if (!result) return;
        try {
          localStorage.setItem("smartdoc_analysis", JSON.stringify(result));
        } catch {}
        set({
          analysis: result,
          lastUpdated: new Date().toISOString(),
        });
      },

      setQuery: (q) => set({ query: { ...get().query, ...q } }),
      resetResult: () => set({ result: null }),
      resetAll: () =>
        set({
          dataset: null,
          analysis: null,
          schema: null,
          quality: null,
          correlations: null,
          result: null,
          domain: null,
          insights: [],
          suggestedCharts: [],
          loading: false,
          error: null,
          lastUpdated: null,
        }),
      setError: (err) => set({ error: err ?? null }),

      // ---- API calls ----

      // Schema + Quality
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

          set({
            schema: payload.structure ?? payload.schema ?? null,
            quality: payload.quality ?? null,
          });
          console.log("✅ Schema & quality detected");
        } catch (e) {
          console.error("❌ Schema detection failed:", e);
          set({ error: e.message });
        } finally {
          set({ loading: false });
        }
      },

      // Deep analysis (domain, insights, charts, correlations)
      analyze: async (context = { persona: "manager", data_type: "generic_dataset" }) => {
        const { dataset } = get();
        if (!dataset) return;

        set({ loading: true, error: null });
        try {
          const headers = await getAuthHeaders({ "Content-Type": "application/json" });
          const res = await fetch(`${API_BASE}/analyze`, {
            method: "POST",
            headers,
            body: JSON.stringify({
              headers: dataset.headers ?? dataset.columns ?? [],
              rows: dataset.rows || dataset.preview || [],
              text_blocks: dataset.text_blocks || [],
              context,
            }),
          });
          if (!res.ok) throw new Error(await res.text());
          const payload = await res.json();

          set({
            domain: payload.domain ?? null,
            insights: payload.insights ?? [],
            suggestedCharts: payload.suggested_charts ?? [],
            correlations: payload.correlations ?? null,
            analysis: payload ?? null,
          });
          console.log("✅ Analysis complete:", payload.insights?.length || 0, "insights");
        } catch (e) {
          console.error("❌ Analysis failed:", e);
          set({ error: e.message });
        } finally {
          set({ loading: false });
        }
      },

      // Explore (metric/groupBy)
      runExplore: async () => {
        const { dataset, result } = get();
        if (!dataset) return;

        const query = result?.query ?? get().query;
        if (!query?.metric || !query?.groupBy) return;

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
          console.log("✅ Exploration complete");
        } catch (e) {
          console.error("❌ Explore failed:", e);
          set({ error: e.message });
        } finally {
          set({ loading: false });
        }
      },

      // Correlation
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
          console.error("❌ Correlation failed:", e);
          set({ error: e.message });
        } finally {
          set({ loading: false });
        }
      },

      // Rehydrate from local cache
      loadFromCache: (uploadId = null) => {
        try {
          const cachedDataset = localStorage.getItem("smartdoc_dataset");
          const cachedAnalysis = localStorage.getItem("smartdoc_analysis");
          if (cachedDataset) set({ dataset: JSON.parse(cachedDataset) });
          if (cachedAnalysis) set({ analysis: JSON.parse(cachedAnalysis) });
          if (uploadId) console.log(`📦 Cache rehydration for upload: ${uploadId}`);
        } catch (e) {
          console.warn("⚠️ Cache rehydration failed:", e);
        }
      },
    }),
    {
      name: "smartdoc-analyze-storage",
      getStorage: () => localStorage,
      partialize: (state) => ({
        dataset: state.dataset,
        schema: state.schema,
        quality: state.quality,
        domain: state.domain,
        insights: state.insights,
        suggestedCharts: state.suggestedCharts,
        correlations: state.correlations,
        analysis: state.analysis,
      }),
    }
  )
);

export default useAnalyzeStore;
