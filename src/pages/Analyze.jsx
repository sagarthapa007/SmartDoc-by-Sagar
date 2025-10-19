import React, { useState, useEffect, useMemo, useCallback } from "react";
import StatCards from "@components/analyzer/StatCards";
import Histogram from "@charts/Histogram";
import Heatmap from "@charts/Heatmap";
import { useSession } from "@context/SessionContext.jsx";

// 🧩 Intelligence Components
import AskSmartDocPanel from "@/components/panels/AskSmartDocPanel.jsx";
import SuggestChartButton from "@/components/analyzer/SuggestChartButton.jsx";
import MultiFilterPanel from "@/components/analyzer/MultiFilterPanel.jsx";
import ExecutiveSummary from "@/components/analyzer/ExecutiveSummary.jsx";
import QualityScore from "@/components/analyzer/QualityScore.jsx";
import InsightCards from "@/components/analyzer/InsightCards.jsx";
import NarrativePanel from "@/components/panels/NarrativePanel.jsx";
import RevenueTrendChart from "@/charts/RevenueTrendChart.jsx";
import TopPerformersChart from "@/charts/TopPerformersChart.jsx";

// 🧠 Utils
import { calculateQualityScore } from "@/utils/qualityMetrics.js";
import { exportToCSV } from "@/utils/exportUtils.js";
import { buildRevenueTrend, topBy, quickSummary } from "@/sampleData.js";

// 🆕 Updated backend client imports
import {
  detectData,
  analyzeData,
  performAction,
} from "@/utils/backendClient.js";

export default function Analyze() {
  const { session } = useSession();
  const ds = session?.dataset;

  // 🎯 State Management
  const [filteredData, setFilteredData] = useState(ds?.rows || []);
  const [activeTab, setActiveTab] = useState("overview");
  const [exportLoading, setExportLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [backendInsights, setBackendInsights] = useState(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  
  const initialQuery = useMemo(() => localStorage.getItem("smartdoc_search") || "", []);

  // 🧩 Universal Context
  const universalContext = useMemo(() => {
    if (!ds?.headers) return { dataType: "unknown", confidence: 0.1 };
    
    const numericCols = ds.headers.filter(h =>
      filteredData.some(r => !isNaN(parseFloat(r[h])))
    );
    
    return {
      dataType: "generic_dataset",
      confidence: Math.min(0.3 + numericCols.length / ds.headers.length, 1).toFixed(2),
      primaryMetric: numericCols[0] || "auto_metric",
    };
  }, [ds, filteredData]);

  // 🧮 Local Data Quality
  const qualityMetrics = useMemo(
    () => calculateQualityScore(filteredData),
    [filteredData]
  );

  // 📈 Local Derived Insights
  const revenueTrendData = useMemo(() => buildRevenueTrend(filteredData), [filteredData]);
  const topPerformersData = useMemo(() => topBy(filteredData, "Customer", "revenue"), [filteredData]);
  const businessSummary = useMemo(
    () => quickSummary(filteredData, universalContext.primaryMetric),
    [filteredData, universalContext.primaryMetric]
  );

  // 📊 KPI Configuration
  const executiveKPIs = useMemo(() => ({
    primaryMetric: universalContext.primaryMetric,
    confidence: universalContext.confidence,
    trends: { growth: 0.153, direction: "positive" },
    dataType: universalContext.dataType,
    rowCount: filteredData.length,
    columnCount: ds?.headers?.length || 0,
  }), [universalContext, filteredData, ds]);

  // 🆕 Backend Insights Fetcher (Detect → Analyze)
  useEffect(() => {
    if (!ds?.rows?.length) return;

    const fetchBackend = async () => {
      setLoadingAnalysis(true);
      try {
        // Step 1️⃣ Detect dataset type
        const detected = await detectData(ds);
        const dataType = detected?.data_type || "generic_dataset";

        // Step 2️⃣ Determine persona context
        const persona = session?.user?.persona || "manager";
        const context = { persona, data_type: dataType };

        // Step 3️⃣ Send for backend analysis
        const res = await analyzeData(ds, context);

        if (res?.for_persona || res?.success) {
          console.log("✅ Backend analysis:", res);
          setBackendInsights(res);
        } else {
          console.warn("⚠️ Backend returned no insights, using fallback.");
          setBackendInsights(null);
        }
      } catch (err) {
        console.error("❌ Backend error:", err);
        setBackendInsights(null);
      } finally {
        setLoadingAnalysis(false);
      }
    };

    fetchBackend();
  }, [ds, session]);

  // 📤 Export Handler
  const handleExport = useCallback(async () => {
    setExportLoading(true);
    try {
      await exportToCSV(filteredData);
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setExportLoading(false);
    }
  }, [filteredData]);

  // 🆕 Perform Action Handler (for backend actions)
  const handleAction = useCallback(async (actionType, payload = {}) => {
    try {
      console.log(`🚀 Executing ${actionType}...`);
      const res = await performAction(actionType, payload);
      if (res?.preview) {
        alert(
          `Preview:\nRemoved: ${res.preview.will_remove}\nKept: ${res.preview.will_keep}`
        );
      } else {
        console.log("Action result:", res);
      }
    } catch (err) {
      console.error(`❌ ${actionType} failed:`, err);
    }
  }, []);

  const toggleMobileMenu = useCallback(() => setMobileMenuOpen(v => !v), []);
  const closeMobileMenu = useCallback(() => setMobileMenuOpen(false), []);

  const handleTabChange = useCallback((tabId) => {
    setActiveTab(tabId);
    closeMobileMenu();
  }, [closeMobileMenu]);

  const analysisTabs = useMemo(() => [
    { id: "overview", label: "Overview", icon: "📊" },
    { id: "technical", label: "Technical", icon: "🔍" },
    { id: "business", label: "Business", icon: "💼" },
    { id: "quality", label: "Quality", icon: "✅" },
  ], []);

  // Fallback insights for different tabs
  const technicalFallback = useMemo(() => ({
    technical: { summary: { rowCount: filteredData.length, colCount: ds?.headers?.length || 0 } },
    business: { context: { dataType: universalContext.dataType } },
  }), [filteredData, ds, universalContext]);

  const businessFallback = useMemo(() => ({
    business: { context: universalContext },
    technical: { summary: { rowCount: filteredData.length, colCount: ds?.headers?.length || 0 } },
  }), [filteredData, ds, universalContext]);

  const narrativeFallback = useMemo(() => ({
    technical: { summary: { rowCount: filteredData.length, colCount: ds?.headers?.length || 0 } },
    business: { context: universalContext },
    quality: qualityMetrics,
  }), [filteredData, ds, universalContext, qualityMetrics]);

  // 🚫 No dataset case
  if (!ds) {
    return (
      <div className="flex flex-col h-[calc(100vh-96px)] items-center justify-center text-center p-6">
        <div className="text-6xl mb-4 opacity-50">📊</div>
        <h3 className="text-lg font-semibold text-[var(--text-strong)] mb-2">
          No Dataset Loaded
        </h3>
        <p className="text-sm text-[var(--text-muted)] max-w-md mb-4">
          Upload a dataset to unlock powerful analysis features.
        </p>
        <button
          onClick={() => (window.location.href = "/upload")}
          className="btn btn-primary w-full max-w-[200px]"
        >
          Go to Upload
        </button>
      </div>
    );
  }

  // === MAIN RENDER ===
  return (
    <div className="flex flex-col h-[calc(100vh-96px)] overflow-hidden bg-[var(--background)] text-[var(--text)]">
      {/* === HEADER === */}
      <header className="flex-none border-b border-[var(--border)] bg-[var(--surface)]">
        <div className="px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <div className="flex items-center justify-between sm:block">
              <div>
                <h1 className="text-lg sm:text-xl font-semibold text-[var(--text-strong)]">
                  Data Analysis
                </h1>
                <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1">
                  {filteredData.length.toLocaleString()} records
                </p>
              </div>
              <button
                onClick={toggleMobileMenu}
                className="sm:hidden btn btn-ghost p-2"
              >
                {mobileMenuOpen ? "✕" : "☰"}
              </button>
            </div>

            <div className={`${mobileMenuOpen ? "flex" : "hidden"} sm:flex flex-col sm:flex-row gap-3 sm:items-center`}>
              <button
                onClick={handleExport}
                disabled={exportLoading}
                className="btn btn-outline flex items-center justify-center gap-2 text-sm disabled:opacity-50 w-full sm:w-auto"
              >
                {exportLoading ? "⏳" : "📥"}
                <span className="sm:inline hidden">Export CSV</span>
              </button>
            </div>
          </div>
        </div>

        <div className="px-4 sm:px-6 pb-3">
          <div className="flex bg-[var(--muted)] rounded-lg p-1 overflow-x-auto">
            {analysisTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all flex-shrink-0 ${
                  activeTab === tab.id
                    ? "bg-[var(--background)] text-[var(--text-strong)] shadow-sm"
                    : "text-[var(--text-muted)] hover:text-[var(--text)]"
                }`}
              >
                <span>{tab.icon}</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="px-4 sm:px-6 pb-4">
          <div className="overflow-x-auto">
            <div className="min-w-max">
              <StatCards headers={ds.headers} rows={filteredData} />
            </div>
          </div>
        </div>
      </header>

      {/* === MAIN CONTENT === */}
      <main className="flex-1 overflow-auto">
        <div className="p-4 sm:p-6 space-y-6">
          {loadingAnalysis && (
            <div className="text-center text-sm text-[var(--text-muted)] animate-pulse">
              🔄 Analyzing dataset on SmartDoc Engine...
            </div>
          )}

          <section className="space-y-4 sm:grid sm:grid-cols-1 lg:grid-cols-3 sm:gap-4">
            <ExecutiveSummary
              kpis={executiveKPIs}
              trends={executiveKPIs.trends}
              summary={backendInsights?.summary || businessSummary}
              className="lg:col-span-2"
              compact={true}
            />
            <QualityScore
              quality={backendInsights?.quality || qualityMetrics}
              dataType={universalContext.dataType}
              compact={true}
            />
          </section>

          <MultiFilterPanel
            data={ds.rows}
            onFilter={setFilteredData}
            context={universalContext}
            mobileOptimized={true}
          />

          {activeTab === "overview" && (
<section className="space-y-6">
    {/* existing charts */}
    <div className="space-y-6 sm:grid sm:grid-cols-1 xl:grid-cols-2 sm:gap-6">
      <RevenueTrendChart
        data={revenueTrendData}
        title="Revenue Trends"
        timeframe="Last 12 Months"
      />
      <TopPerformersChart
        data={topPerformersData}
        metric="revenue"
        title="Top Customers"
        limit={6}
      />
    </div>

    {/* 🆕 intelligence add-ons */}
    <SuggestChartButton dataset={ds} />
    <AskSmartDocPanel dataset={ds} />

    <NarrativePanel
      insights={backendInsights?.narrative || {
        technical: { summary: { rowCount: filteredData.length, colCount: ds.headers.length } },
        business: { context: universalContext },
        quality: qualityMetrics,
      }}
      context={universalContext}
      compact={true}
    />
  </section>
          )}

          {activeTab === "technical" && (
            <section className="space-y-6">
              <div className="space-y-6 sm:grid sm:grid-cols-1 lg:grid-cols-2 sm:gap-6">
                <div className="card p-4">
                  <h3 className="text-base font-semibold mb-4">Correlations</h3>
                  <div className="h-[280px] sm:h-[320px]">
                    <Heatmap headers={ds.headers} rows={filteredData} />
                  </div>
                </div>
                <div className="card p-4">
                  <h3 className="text-base font-semibold mb-4">Distributions</h3>
                  <div className="h-[280px] sm:h-[320px]">
                    <Histogram headers={ds.headers} rows={filteredData} />
                  </div>
                </div>
              </div>
              <InsightCards
                insights={backendInsights?.technical || technicalFallback}
                variant="technical"
                compact={true}
                onAction={handleAction}
              />
            </section>
          )}

          {activeTab === "business" && (
            <section className="space-y-6">
              <div className="space-y-6 sm:grid sm:grid-cols-1 lg:grid-cols-2 sm:gap-6">
                <RevenueTrendChart data={revenueTrendData} title="Performance" />
                <TopPerformersChart data={topPerformersData} metric="revenue" title="Rankings" />
              </div>
              <InsightCards
                insights={backendInsights?.business || businessFallback}
                variant="business"
                compact={true}
                onAction={handleAction}
              />
            </section>
          )}

          {activeTab === "quality" && (
            <section className="space-y-6">
              <div className="card p-4">
                <h3 className="text-base font-semibold mb-4">Data Quality</h3>
                <QualityScore
                  quality={backendInsights?.quality || qualityMetrics}
                  showBreakdown={true}
                  showRecommendations={true}
                  compact={true}
                />
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}