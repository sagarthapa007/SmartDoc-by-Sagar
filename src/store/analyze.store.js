import { create } from "zustand";
import { persist } from "zustand/middleware";

const API_BASE = import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "/api";

export const useAnalyzeStore = create(
  persist(
    (set, get) => ({
      // ---- Data States ----
      dataset: null,           // { headers: [], rows: [] }
      schema: null,            // backend structure summary (or derived)
      quality: null,           // { overall, dimensions, missing, outliers, duplicates }
      domain: null,            // e.g. "finance", "hr", "sales"
      insights: [],            // natural-language insights
      suggestedCharts: [],     // [{ id, type, x, y, title, reason }]
      correlations: null,      // { matrix, strongest, pairs }
      result: null,            // result of explore query

      // ---- UI State ----
      loading: false,
      error: null,

      // ---- Setters ----
      setDataset: (ds) => {
        console.log("📊 Dataset updated:", ds?.headers?.length, "columns,", ds?.rows?.length, "rows");
        set({ dataset: ds });
      },
      setError: (err) => set({ error: err ?? null }),
      resetResult: () => set({ result: null }),
      resetAll: () =>
        set({
          dataset: null,
          schema: null,
          quality: null,
          domain: null,
          insights: [],
          suggestedCharts: [],
          correlations: null,
          result: null,
          loading: false,
          error: null,
        }),

      // ---- API Calls ----

      // 🧠 Detect schema + quality
      detectSchemaAndQuality: async () => {
        const { dataset } = get();
        if (!dataset) return;

        set({ loading: true, error: null });
        try {
          const res = await fetch(`${API_BASE}/quality`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
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

      // 🤖 Deep analysis (AI insights, charts, domain detection)
      analyze: async (context = { persona: "manager", data_type: "generic_dataset" }) => {
        const { dataset } = get();
        if (!dataset) return;

        set({ loading: true, error: null });
        try {
          const res = await fetch(`${API_BASE}/analyze`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              headers: dataset.headers,
              rows: dataset.rows || [],
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
          });
          console.log("✅ Analysis complete:", payload.insights?.length || 0, "insights");
        } catch (e) {
          console.error("❌ Analysis failed:", e);
          set({ error: e.message });
        } finally {
          set({ loading: false });
        }
      },

      // 📈 Data exploration (metric/groupBy queries)
      runExplore: async () => {
        const { dataset, result } = get();
        if (!dataset) return;

        const query = result?.query ?? get().query;
        if (!query?.metric || !query?.groupBy) return;

        set({ loading: true, error: null });
        try {
          const res = await fetch(`${API_BASE}/explore`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
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

      // 🔬 Correlation matrix
      runCorrelate: async (target, threshold = 0.5) => {
        const { dataset } = get();
        if (!dataset) return;

        set({ loading: true, error: null });
        try {
          const res = await fetch(`${API_BASE}/correlate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
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
    }),
    {
      name: "smartdoc-analyze-storage", // LocalStorage key
      getStorage: () => localStorage,
      partialize: (state) => ({
        dataset: state.dataset,
        schema: state.schema,
        quality: state.quality,
        domain: state.domain,
        insights: state.insights,
        suggestedCharts: state.suggestedCharts,
        correlations: state.correlations,
      }),
    }
  )
);
