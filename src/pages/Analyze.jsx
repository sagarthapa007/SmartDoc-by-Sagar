import React, { useState, useMemo } from "react";
import StatCards from "@components/analyzer/StatCards";
import Histogram from "@charts/Histogram";
import Heatmap from "@charts/Heatmap";
import { useSession } from "@context/SessionContext.jsx";

// 🧠 Phase F Intelligence
import MultiFilterPanel from "@/components/analyzer/MultiFilterPanel.jsx";
import ExecutiveSummary from "@/components/analyzer/ExecutiveSummary.jsx";
import QualityScore from "@/components/analyzer/QualityScore.jsx";
import InsightCards from "@/components/analyzer/InsightCards.jsx";
import NarrativePanel from "@/components/panels/NarrativePanel.jsx";
import RevenueTrendChart from "@/charts/RevenueTrendChart.jsx";
import TopPerformersChart from "@/charts/TopPerformersChart.jsx";

import { BusinessDetector } from "@/intelligence/BusinessDetector.js";
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

  // Early return for no data
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
          onClick={() => window.location.href = '/upload'}
          className="btn btn-primary"
        >
          Go to Upload
        </button>
      </div>
    );
  }

  // 🧩 Intelligence Layer Computations
  const businessContext = useMemo(() => 
    BusinessDetector.analyze({ headers: ds.headers, rows: filteredData }), 
    [filteredData, ds.headers]
  );

  const qualityMetrics = useMemo(() => 
    calculateQualityScore(filteredData), 
    [filteredData]
  );

  const revenueTrendData = useMemo(() => 
    buildRevenueTrend(filteredData), 
    [filteredData]
  );

  const topPerformersData = useMemo(() => 
    topBy(filteredData, "Customer", "revenue"), 
    [filteredData]
  );

  const businessSummary = useMemo(() => 
    quickSummary(filteredData, businessContext.primaryMetric || "revenue"), 
    [filteredData, businessContext.primaryMetric]
  );

  // 📊 KPI Configuration
  const executiveKPIs = {
    primaryMetric: businessContext.primaryMetric || "revenue",
    confidence: businessContext.confidence,
    trends: { growth: 0.153, direction: "positive" },
    dataType: businessContext.dataType,
    rowCount: filteredData.length,
    columnCount: ds.headers.length
  };

  // 📤 Export Handler
  const handleExport = async () => {
    setExportLoading(true);
    try {
      await exportToCSV(filteredData);
      // Optional: Add success toast here
    } catch (error) {
      console.error("Export failed:", error);
      // Optional: Add error toast here
    } finally {
      setExportLoading(false);
    }
  };

  // 🎨 Tab Configuration
  const analysisTabs = [
    { id: "overview", label: "Overview", icon: "📊" },
    { id: "technical", label: "Technical", icon: "🔍" },
    { id: "business", label: "Business", icon: "💼" },
    { id: "quality", label: "Quality", icon: "✅" },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-96px)] overflow-hidden bg-[var(--background)] text-[var(--text)]">
      
      {/* === HEADER: Controls & Navigation === */}
      <header className="flex-none border-b border-[var(--border)] bg-[var(--surface)]">
        <div className="px-6 py-4">
          {/* Title & Actions Row */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-semibold text-[var(--text-strong)]">
                Data Intelligence Dashboard
              </h1>
              <p className="text-sm text-[var(--text-muted)] mt-1">
                Analyzing {filteredData.length.toLocaleString()} records • {businessContext.dataType} dataset
              </p>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleExport}
                disabled={exportLoading}
                className="btn btn-outline flex items-center gap-2 text-sm disabled:opacity-50"
              >
                {exportLoading ? (
                  <>⏳ Exporting...</>
                ) : (
                  <>📥 Export CSV</>
                )}
              </button>
              
              {/* View Toggle */}
              <div className="flex bg-[var(--muted)] rounded-lg p-1">
                {analysisTabs.map(tab => (
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

          {/* Quick Stats Bar */}
          <StatCards headers={ds.headers} rows={filteredData} />
        </div>
      </header>

      {/* === MAIN CONTENT: Scrollable Analysis === */}
      <main className="flex-1 overflow-auto">
        <div className="p-6 space-y-6">
          
          {/* 🎯 INTELLIGENCE LAYER - Always Visible */}
          <section className="space-y-4">
            {/* Context & Quality Banner */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <ExecutiveSummary 
                kpis={executiveKPIs} 
                trends={executiveKPIs.trends} 
                summary={businessSummary} 
                className="lg:col-span-2"
              />
              <QualityScore 
                quality={qualityMetrics} 
                dataType={businessContext.dataType}
              />
            </div>

            {/* Interactive Filters */}
            <MultiFilterPanel 
              data={ds.rows} 
              onFilter={setFilteredData}
              context={businessContext}
            />
          </section>

          {/* 📈 VISUALIZATION SECTIONS - Tab Controlled */}
          {activeTab === "overview" && (
            <section className="space-y-6">
              {/* Business Intelligence */}
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

              {/* AI Narrative */}
              <NarrativePanel
                insights={{
                  technical: {
                    summary: {
                      rowCount: filteredData.length,
                      colCount: ds.headers.length,
                    },
                  },
                  business: { context: businessContext },
                  quality: qualityMetrics,
                }}
                context={businessContext}
              />
            </section>
          )}

          {activeTab === "technical" && (
            <section className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-semibold">Correlation Matrix</h3>
                    <span className="text-xs badge badge-outline">Interactive</span>
                  </div>
                  <Heatmap headers={ds.headers} rows={filteredData} height="320px" />
                </div>

                <div className="card">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-semibold">Distribution Analysis</h3>
                    <span className="text-xs badge badge-outline">Statistical</span>
                  </div>
                  <Histogram headers={ds.headers} rows={filteredData} height="320px" />
                </div>
              </div>

              <InsightCards
                insights={{
                  technical: {
                    summary: {
                      rowCount: filteredData.length,
                      colCount: ds.headers.length,
                      missingAvg: 0,
                    },
                  },
                  business: { context: { dataType: businessContext.dataType } },
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
                  showForecast={true}
                />
                <TopPerformersChart 
                  data={topPerformersData} 
                  metric="revenue"
                  title="Customer Rankings"
                  showMetrics={true}
                />
              </div>
              
              <InsightCards
                insights={{
                  technical: {
                    summary: {
                      rowCount: filteredData.length,
                      colCount: ds.headers.length,
                    },
                  },
                  business: { context: businessContext },
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
                    showBreakdown={true}
                    showRecommendations={true}
                  />
                </div>
                
                <div className="card">
                  <h3 className="text-base font-semibold mb-4">Data Health Summary</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Completeness</span>
                      <span className="text-sm font-medium">{qualityMetrics.dimensions?.completeness || 0}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Accuracy Score</span>
                      <span className="text-sm font-medium">{qualityMetrics.dimensions?.accuracy || 0}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Consistency</span>
                      <span className="text-sm font-medium">{qualityMetrics.dimensions?.consistency || 0}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* 📝 LEGACY COMPATIBILITY SECTION */}
          <section className="mt-8 pt-6 border-t border-[var(--border)]">
            <div className="card bg-[var(--muted)]/30">
              <h3 className="text-sm font-semibold mb-2 text-[var(--text-muted)]">
                Legacy Analysis Engine
              </h3>
              <p className="text-sm opacity-75 leading-relaxed">
                Basic statistical analysis and visualization. For advanced intelligence, 
                use the <strong>Enterprise Intelligence Layer</strong> above.
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}