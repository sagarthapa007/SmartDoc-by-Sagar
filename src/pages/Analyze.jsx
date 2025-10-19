import React, { useState, useEffect, useMemo } from "react";
import StatCards from "@components/analyzer/StatCards";
import Histogram from "@charts/Histogram";
import Heatmap from "@charts/Heatmap";
import { useSession } from "@context/SessionContext.jsx";

// 🧩 Intelligence Components
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
import { analyzeData } from "@/utils/backendClient.js";

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
  const executiveKPIs = {
    primaryMetric: universalContext.primaryMetric,
    confidence: universalContext.confidence,
    trends: { growth: 0.153, direction: "positive" },
    dataType: universalContext.dataType,
    rowCount: filteredData.length,
    columnCount: ds?.headers?.length || 0,
  };

  // 🧠 Fetch backend insights
  useEffect(() => {
    if (!ds?.rows?.length) return;
    const fetchBackend = async () => {
      setLoadingAnalysis(true);
      try {
        const res = await analyzeData(ds);
        if (res?.success) {
          console.log("✅ Backend analysis:", res);
          setBackendInsights(res.data);
        } else {
          console.warn("⚠️ Backend analysis failed, using local fallback.");
          setBackendInsights(null);
        }
      } catch (err) {
        console.error("Backend error:", err);
        setBackendInsights(null);
      } finally {
        setLoadingAnalysis(false);
      }
    };
    fetchBackend();
  }, [ds]);

  // 📤 Export Handler
  const handleExport = async () => {
    setExportLoading(true);
    try {
      await exportToCSV(filteredData);
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setExportLoading(false);
    }
  };

  const analysisTabs = [
    { id: "overview", label: "Overview", icon: "📊" },
    { id: "technical", label: "Technical", icon: "🔍" },
    { id: "business", label: "Business", icon: "💼" },
    { id: "quality", label: "Quality", icon: "✅" },
  ];

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
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="sm:hidden btn btn-ghost p-2"
              >
                {mobileMenuOpen ? "✕" : "☰"}
              </button>
            </div>

            <div className={`${mobileMenuOpen ? 'flex' : 'hidden'} sm:flex flex-col sm:flex-row gap-3 sm:items-center`}>
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
            {analysisTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setMobileMenuOpen(false);
                }}
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
              <div className="space-y-6 sm:grid sm:grid-cols-1 xl:grid-cols-2 sm:gap-6">
                <RevenueTrendChart data={revenueTrendData} title="Revenue Trends" timeframe="Last 12 Months" />
                <TopPerformersChart data={topPerformersData} metric="revenue" title="Top Customers" limit={6} />
              </div>
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
                insights={backendInsights?.technical || {
                  technical: { summary: { rowCount: filteredData.length, colCount: ds.headers.length } },
                  business: { context: { dataType: universalContext.dataType } },
                }}
                variant="technical"
                compact={true}
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
                insights={backendInsights?.business || {
                  business: { context: universalContext },
                  technical: { summary: { rowCount: filteredData.length, colCount: ds.headers.length } },
                }}
                variant="business"
                compact={true}
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
