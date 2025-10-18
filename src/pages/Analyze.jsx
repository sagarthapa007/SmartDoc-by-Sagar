import React, { useState, useMemo } from "react";
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

import { calculateQualityScore } from "@/utils/qualityMetrics.js";
import { exportToCSV } from "@/utils/exportUtils.js";
import { buildRevenueTrend, topBy, quickSummary } from "@/sampleData.js";

export default function Analyze() {
  const { session } = useSession();
  const ds = session?.dataset;

  // 🎯 State Management
  const [filteredData, setFilteredData] = useState(ds?.rows || []);
  const [activeTab, setActiveTab] = useState("overview");
  const [exportLoading, setExportLoading] = useState(false);

  // 🧩 Universal Intelligence Placeholder
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

  // 🧮 Data Quality
  const qualityMetrics = useMemo(
    () => calculateQualityScore(filteredData),
    [filteredData]
  );

  // 📈 Derived Insights
  const revenueTrendData = useMemo(
    () => buildRevenueTrend(filteredData),
    [filteredData]
  );
  const topPerformersData = useMemo(
    () => topBy(filteredData, "Customer", "revenue"),
    [filteredData]
  );
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
      <div className="flex flex-col h-[calc(100vh-96px)] items-center justify-center text-center p-8">
        <div className="text-6xl mb-4 opacity-50">📊</div>
        <h3 className="text-lg font-semibold text-[var(--text-strong)] mb-2">
          No Dataset Loaded
        </h3>
        <p className="text-sm text-[var(--text-muted)] max-w-md mb-4">
          Upload a dataset to unlock powerful analysis and intelligence features.
        </p>
        <button
          onClick={() => (window.location.href = "/upload")}
          className="btn btn-primary"
        >
          Go to Upload
        </button>
      </div>
    );
  }

  // ==========================
  // 💡 MAIN ANALYSIS INTERFACE
  // ==========================
  return (
    <div className="flex flex-col h-[calc(100vh-96px)] overflow-hidden bg-[var(--background)] text-[var(--text)]">
      {/* === HEADER === */}
      <header className="flex-none border-b border-[var(--border)] bg-[var(--surface)]">
        <div className="px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-semibold text-[var(--text-strong)]">
              Data Intelligence Dashboard
            </h1>
            <p className="text-sm text-[var(--text-muted)] mt-1">
              Analyzing {filteredData.length.toLocaleString()} records •{" "}
              {universalContext.dataType}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExport}
              disabled={exportLoading}
              className="btn btn-outline flex items-center gap-2 text-sm disabled:opacity-50"
            >
              {exportLoading ? "⏳ Exporting..." : "📥 Export CSV"}
            </button>

            <div className="flex bg-[var(--muted)] rounded-lg p-1">
              {analysisTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? "bg-[var(--background)] text-[var(--text-strong)] shadow-sm"
                      : "text-[var(--text-muted)] hover:text-[var(--text)]"
                  }`}
                >
                  <span>{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="px-6 pb-4">
          <StatCards headers={ds.headers} rows={filteredData} />
        </div>
      </header>

      {/* === MAIN CONTENT === */}
      <main className="flex-1 overflow-auto">
        <div className="p-6 space-y-6">
          {/* 🎯 Universal Context + Quality */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <ExecutiveSummary
              kpis={executiveKPIs}
              trends={executiveKPIs.trends}
              summary={businessSummary}
              className="lg:col-span-2"
            />
            <QualityScore quality={qualityMetrics} dataType={universalContext.dataType} />
          </section>

          {/* 🧩 Filters */}
          <MultiFilterPanel
            data={ds.rows}
            onFilter={setFilteredData}
            context={universalContext}
          />

          {/* 📈 Tabs */}
          {activeTab === "overview" && (
            <section className="space-y-6">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <RevenueTrendChart
                  data={revenueTrendData}
                  title="Revenue Trend Analysis"
                  timeframe="Last 12 Months"
                />
                <TopPerformersChart
                  data={topPerformersData}
                  metric="revenue"
                  title="Top Performing Customers"
                  limit={8}
                />
              </div>
              <NarrativePanel
                insights={{
                  technical: { summary: { rowCount: filteredData.length, colCount: ds.headers.length } },
                  business: { context: universalContext },
                  quality: qualityMetrics,
                }}
                context={universalContext}
              />
            </section>
          )}

          {activeTab === "technical" && (
            <section className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card">
                  <h3 className="text-base font-semibold mb-4">Correlation Matrix</h3>
                  <Heatmap headers={ds.headers} rows={filteredData} height="320px" />
                </div>
                <div className="card">
                  <h3 className="text-base font-semibold mb-4">Distribution Analysis</h3>
                  <Histogram headers={ds.headers} rows={filteredData} height="320px" />
                </div>
              </div>
              <InsightCards
                insights={{
                  technical: { summary: { rowCount: filteredData.length, colCount: ds.headers.length } },
                  business: { context: { dataType: universalContext.dataType } },
                }}
                variant="technical"
              />
            </section>
          )}

          {activeTab === "business" && (
            <section className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <RevenueTrendChart
                  data={revenueTrendData}
                  title="Business Performance"
                  showForecast
                />
                <TopPerformersChart
                  data={topPerformersData}
                  metric="revenue"
                  title="Customer Rankings"
                  showMetrics
                />
              </div>
              <InsightCards
                insights={{
                  business: { context: universalContext },
                  technical: { summary: { rowCount: filteredData.length, colCount: ds.headers.length } },
                }}
                variant="business"
              />
            </section>
          )}

          {activeTab === "quality" && (
            <section className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card">
                  <h3 className="text-base font-semibold mb-4">Data Quality Dashboard</h3>
                  <QualityScore
                    quality={qualityMetrics}
                    showBreakdown
                    showRecommendations
                  />
                </div>
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
