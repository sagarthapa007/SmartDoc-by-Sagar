import React, { useEffect, useState, useCallback, useMemo } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Database,
  Brain,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  FileText,
  RefreshCw,
  Upload,
  Lightbulb,
  Zap,
  TrendingUp,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  Download,
  Share2,
  Filter,
  Clock,
  Cpu,
  Smartphone,
  Tablet,
  Monitor,
} from "lucide-react";
import { useSession } from "@/context/SessionContext.jsx";
import useAnalyzeStore from "@/components/analyzer/analyze.store.js";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
  CartesianGrid,
  Legend,
} from "recharts";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

/* Enhanced Card component with mobile responsiveness */
const Card = ({
  title,
  icon: Icon,
  children,
  color = "blue",
  className = "",
  actions,
  loading = false,
  fullWidth = false,
}) => {
  const colorMap = {
    blue: {
      bg: "bg-blue-50",
      border: "border-blue-200",
      icon: "text-blue-600",
    },
    green: {
      bg: "bg-green-50",
      border: "border-green-200",
      icon: "text-green-600",
    },
    purple: {
      bg: "bg-purple-50",
      border: "border-purple-200",
      icon: "text-purple-600",
    },
    amber: {
      bg: "bg-amber-50",
      border: "border-amber-200",
      icon: "text-amber-600",
    },
    red: { bg: "bg-red-50", border: "border-red-200", icon: "text-red-600" },
    indigo: {
      bg: "bg-indigo-50",
      border: "border-indigo-200",
      icon: "text-indigo-600",
    },
  };

  const colors = colorMap[color] || colorMap.blue;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border ${colors.border} bg-white shadow-sm hover:shadow-md transition-all duration-300 ${
        fullWidth ? "w-full" : ""
      } ${className}`}
    >
      <div
        className={`flex items-center justify-between px-4 py-3 border-b ${colors.border} ${colors.bg}`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Icon className={`${colors.icon} flex-shrink-0`} size={18} />
          <h3 className="font-semibold text-sm truncate">{title}</h3>
        </div>
        {actions && <div className="flex items-center gap-1 flex-shrink-0 ml-2">{actions}</div>}
      </div>
      <div className="p-4">{loading ? <LoadingShimmer /> : children}</div>
    </motion.div>
  );
};

/* Enhanced loading shimmer */
const LoadingShimmer = ({ lines = 3, variant = "default" }) => {
  if (variant === "chart") {
    return (
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
        <div className="h-32 bg-gray-100 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {[...Array(lines)].map((_, i) => (
        <div key={i} className="h-4 bg-gray-200 rounded animate-pulse" />
      ))}
    </div>
  );
};

/* Chart color palettes */
const CHART_COLORS = {
  blue: ["#3b82f6", "#60a5fa", "#93c5fd", "#bfdbfe"],
  gradient: ["#3b82f6", "#06b6d4", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444"],
  categorical: [
    "#3b82f6",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#06b6d4",
  ],
  sequential: ["#1e40af", "#3b82f6", "#60a5fa", "#93c5fd", "#bfdbfe"],
};

/* Utility function to format large numbers */
const formatNumber = (num) => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toString();
};

/* Mobile detection hook */
const useMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
};

export default function Analyze() {
  const { session } = useSession();
  const { dataset, setDataset, analysis: storeAnalysis } = useAnalyzeStore();
  const isMobile = useMobile();

  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // Use analysis from store if available, otherwise local state
  const currentAnalysis = storeAnalysis || analysis;

  // Automatically trigger analysis when dataset/upload is ready
  useEffect(() => {
    const uploadId = session?.uploadId || sessionStorage.getItem("latest_upload_id");
    if (!uploadId || currentAnalysis) return;

    runAnalysis(uploadId);
  }, [session?.uploadId, currentAnalysis]);

  const runAnalysis = async (uploadId) => {
    setLoading(true);
    setError("");
    setProgress(10);

    try {
      // Progressive visual loading
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + Math.random() * 15;
        });
      }, 300);

      // ✅ FIXED: Ensure scrutiny structure matches backend expectations
      const body = {
        upload_id: uploadId,
        scrutiny: dataset?.scrutiny || dataset || { preview: dataset?.preview || [] },
      };

      const res = await axios.post(`${API_URL}/analyze`, body, {
        headers: { "Content-Type": "application/json" },
      });

      clearInterval(progressInterval);
      setProgress(100);
      
      // ✅ FIXED: Update both local state and store properly
      const analysisData = res.data;
      setAnalysis(analysisData);

      // ✅ FIXED: Pass object instead of function to setDataset
      const updatedDataset = {
        ...dataset,
        analysis: analysisData,
        lastUpdated: new Date().toISOString(),
      };
      setDataset(updatedDataset);

      setLastUpdated(new Date().toLocaleTimeString());

      // Smooth scroll to top after analysis completion
      window.scrollTo({ top: 0, behavior: "smooth" });

      // Cache analysis for re-use
      localStorage.setItem(
        `analysis_${uploadId}`,
        JSON.stringify({
          data: analysisData,
          timestamp: new Date().toISOString(),
        }),
      );
    } catch (err) {
      console.error("Analysis error:", err);
      setError(err.response?.data?.detail || "Failed to analyze file");

      // Fallback to cached result if network/API fails
      const cached = localStorage.getItem(`analysis_${uploadId}`);
      if (cached) {
        const { data } = JSON.parse(cached);
        setAnalysis(data);
        setError(
          "Using cached analysis - " +
            (err.response?.data?.detail || "Network error"),
        );
      }
    } finally {
      setLoading(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  const exportAnalysis = useCallback(async () => {
    if (!currentAnalysis) return;

    setExporting(true);
    try {
      const report = {
        summary: currentAnalysis.summary,
        insights: currentAnalysis.insights,
        recommendations: currentAnalysis.recommendations,
        metadata: currentAnalysis.metadata,
        exportedAt: new Date().toISOString(),
      };

      const blob = new Blob([JSON.stringify(report, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `analysis-report-${session?.uploadId || "unknown"}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setExporting(false);
    }
  }, [currentAnalysis, session?.uploadId]);

  const shareAnalysis = useCallback(async () => {
    if (!currentAnalysis) return;

    try {
      const shareData = {
        title: "AI Analysis Report",
        text: currentAnalysis.summary,
        url: window.location.href,
      };

      if (navigator.share && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert("Analysis link copied to clipboard!");
      }
    } catch (err) {
      console.error("Share failed:", err);
    }
  }, [currentAnalysis]);

  const renderCharts = useCallback((charts) => {
    if (!charts?.length) {
      return (
        <div className="text-center py-8 text-gray-500 text-sm">
          <BarChartIcon size={32} className="mx-auto mb-2 opacity-50" />
          No charts available for this analysis.
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {charts.map((chart, i) => {
          const chartData = chart.labels?.map((label, idx) => ({
            name: label,
            value: chart.values?.[idx] || 0,
            label: label,
            ...chart,
          })) || [];

          if (chart.type === "bar") {
            return (
              <div
                key={i}
                className="border border-gray-200 rounded-xl p-4 bg-white hover:shadow-sm transition-shadow"
              >
                <div className="flex items-center gap-2 mb-3">
                  <BarChartIcon size={16} className="text-blue-600" />
                  <h4 className="text-sm font-semibold">{chart.title}</h4>
                </div>
                <ResponsiveContainer width="100%" height={isMobile ? 200 : 250}>
                  <BarChart
                    data={chartData}
                    margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: isMobile ? 10 : 11 }}
                      angle={isMobile ? -45 : 0}
                      textAnchor={isMobile ? "end" : "middle"}
                      height={isMobile ? 80 : 60}
                    />
                    <YAxis tick={{ fontSize: isMobile ? 10 : 11 }} />
                    <Tooltip
                      formatter={(value) => [formatNumber(value), chart.title]}
                      labelFormatter={(label) => `Category: ${label}`}
                    />
                    <Bar
                      dataKey="value"
                      fill={chart.color || CHART_COLORS.blue[0]}
                      radius={[4, 4, 0, 0]}
                      name={chart.title}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            );
          } else if (chart.type === "pie") {
            return (
              <div
                key={i}
                className="border border-gray-200 rounded-xl p-4 bg-white hover:shadow-sm transition-shadow"
              >
                <div className="flex items-center gap-2 mb-3">
                  <PieChartIcon size={16} className="text-purple-600" />
                  <h4 className="text-sm font-semibold">{chart.title}</h4>
                </div>
                <ResponsiveContainer width="100%" height={isMobile ? 200 : 250}>
                  <PieChart>
                    <Pie
                      data={chartData}
                      dataKey="value"
                      nameKey="name"
                      outerRadius={isMobile ? 60 : 80}
                      innerRadius={isMobile ? 30 : 40}
                      label={({ name, percent }) =>
                        isMobile ? `${(percent * 100).toFixed(0)}%` : `${name} (${(percent * 100).toFixed(1)}%)`
                      }
                      labelLine={false}
                    >
                      {chartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            CHART_COLORS.gradient[
                              index % CHART_COLORS.gradient.length
                            ]
                          }
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => [formatNumber(value), "Count"]}
                    />
                    {!isMobile && <Legend />}
                  </PieChart>
                </ResponsiveContainer>
              </div>
            );
          } else if (chart.type === "line") {
            return (
              <div
                key={i}
                className="border border-gray-200 rounded-xl p-4 bg-white hover:shadow-sm transition-shadow"
              >
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp size={16} className="text-green-600" />
                  <h4 className="text-sm font-semibold">{chart.title}</h4>
                </div>
                <ResponsiveContainer width="100%" height={isMobile ? 200 : 250}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: isMobile ? 10 : 11 }} />
                    <YAxis tick={{ fontSize: isMobile ? 10 : 11 }} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke={CHART_COLORS.gradient[1]}
                      strokeWidth={2}
                      dot={{
                        fill: CHART_COLORS.gradient[1],
                        strokeWidth: 2,
                        r: isMobile ? 3 : 4,
                      }}
                      activeDot={{ r: isMobile ? 4 : 6, fill: CHART_COLORS.gradient[0] }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            );
          }
          return null;
        })}
      </div>
    );
  }, [isMobile]);

  const renderInsights = useCallback(
    (insights) => (
      <div className="space-y-3">
        {insights?.length ? (
          insights.map((ins, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="p-3 border border-gray-100 rounded-lg bg-gradient-to-r from-blue-50 to-transparent hover:from-blue-100 transition-colors group"
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  <Lightbulb className="text-blue-600" size={12} />
                </div>
                <p className="text-sm leading-relaxed">{ins}</p>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500 text-sm">
            <Brain size={32} className="mx-auto mb-2 opacity-50" />
            No insights generated for this analysis.
          </div>
        )}
      </div>
    ),
    [],
  );

  const analysisMetadata = useMemo(() => {
    if (!currentAnalysis) return null;

    return {
      documentType: currentAnalysis.metadata?.document_type || "unknown",
      analysisVersion: currentAnalysis.metadata?.analysis_version || "1.0",
      timestamp: lastUpdated,
      chartCount: currentAnalysis.charts?.length || 0,
      insightCount: currentAnalysis.insights?.length || 0,
      recommendationCount: currentAnalysis.recommendations?.length || 0,
    };
  }, [currentAnalysis, lastUpdated]);

  // Mobile tabs for better navigation
  const mobileTabs = [
    { id: "overview", label: "Overview", icon: Database },
    { id: "insights", label: "Insights", icon: Brain },
    { id: "charts", label: "Charts", icon: BarChart3 },
    { id: "actions", label: "Actions", icon: CheckCircle },
  ];

  const renderMobileView = () => (
    <div className="space-y-4">
      {/* Mobile Tabs */}
      <div className="flex border-b border-gray-200 overflow-x-auto">
        {mobileTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? "border-blue-500 text-blue-600 bg-blue-50"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <tab.icon size={16} />
            <span className="text-sm font-medium">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="space-y-4">
        {activeTab === "overview" && (
          <>
            <Card title="Executive Summary" icon={Database} fullWidth>
              {currentAnalysis.summary ? (
                <div className="space-y-3">
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {currentAnalysis.summary}
                  </p>
                </div>
              ) : (
                <LoadingShimmer />
              )}
            </Card>
            
            <Card title="Quick Stats" icon={TrendingUp} color="purple" fullWidth>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-3 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {analysisMetadata?.insightCount || 0}
                  </div>
                  <div className="text-xs text-purple-600 mt-1">Insights</div>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {analysisMetadata?.chartCount || 0}
                  </div>
                  <div className="text-xs text-blue-600 mt-1">Charts</div>
                </div>
              </div>
            </Card>
          </>
        )}

        {activeTab === "insights" && (
          <Card title="AI Insights & Patterns" icon={Brain} fullWidth>
            {renderInsights(currentAnalysis.insights)}
          </Card>
        )}

        {activeTab === "charts" && (
          <Card title="Data Visualizations" icon={BarChart3} fullWidth>
            {renderCharts(currentAnalysis.charts)}
          </Card>
        )}

        {activeTab === "actions" && (
          <>
            <Card title="Actionable Recommendations" icon={CheckCircle} color="green" fullWidth>
              {currentAnalysis.recommendations?.length ? (
                <ul className="space-y-3">
                  {currentAnalysis.recommendations.map((r, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-100 group hover:bg-green-100 transition-colors"
                    >
                      <CheckCircle
                        size={16}
                        className="text-green-600 mt-0.5 flex-shrink-0"
                      />
                      <span className="text-sm leading-relaxed">{r}</span>
                    </motion.li>
                  ))}
                </ul>
              ) : (
                <div className="text-center py-8 text-gray-500 text-sm">
                  <CheckCircle size={32} className="mx-auto mb-2 opacity-50" />
                  No recommendations available.
                </div>
              )}
            </Card>

            <Card title="Export & Share" icon={Share2} color="amber" fullWidth>
              <div className="space-y-3">
                <button
                  onClick={exportAnalysis}
                  disabled={exporting}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                >
                  <Download size={16} />
                  {exporting ? "Exporting..." : "Export Report"}
                </button>
                <button
                  onClick={shareAnalysis}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  <Share2 size={16} />
                  Share Analysis
                </button>
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  );

  const renderDesktopView = () => (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      {/* Left Column - Summary & Insights */}
      <div className="space-y-6">
        <Card
          title="Executive Summary"
          icon={Database}
          actions={<Cpu size={14} className="text-gray-400" />}
        >
          {currentAnalysis.summary ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-700 leading-relaxed">
                {currentAnalysis.summary}
              </p>
              {analysisMetadata && (
                <div className="flex items-center gap-4 text-xs text-gray-500 pt-2 border-t border-gray-100">
                  <span>Version: {analysisMetadata.analysisVersion}</span>
                  <span>Charts: {analysisMetadata.chartCount}</span>
                  <span>Insights: {analysisMetadata.insightCount}</span>
                </div>
              )}
            </div>
          ) : (
            <LoadingShimmer />
          )}
        </Card>

        <Card title="AI Insights & Patterns" icon={Brain} loading={loading}>
          {renderInsights(currentAnalysis.insights)}
        </Card>
      </div>

      {/* Middle Column - Charts & Visualizations */}
      <div className="space-y-6">
        <Card
          title="Data Visualizations"
          icon={BarChart3}
          actions={
            <Filter
              size={14}
              className="text-gray-400 hover:text-gray-600 cursor-pointer"
            />
          }
          loading={loading}
        >
          {renderCharts(currentAnalysis.charts)}
        </Card>
      </div>

      {/* Right Column - Recommendations & Metadata */}
      <div className="space-y-6">
        <Card
          title="Actionable Recommendations"
          icon={CheckCircle}
          color="green"
          loading={loading}
        >
          {currentAnalysis.recommendations?.length ? (
            <ul className="space-y-3">
              {currentAnalysis.recommendations.map((r, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-100 group hover:bg-green-100 transition-colors"
                >
                  <CheckCircle
                    size={16}
                    className="text-green-600 mt-0.5 flex-shrink-0"
                  />
                  <span className="text-sm leading-relaxed">{r}</span>
                </motion.li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-8 text-gray-500 text-sm">
              <CheckCircle size={32} className="mx-auto mb-2 opacity-50" />
              No recommendations available.
            </div>
          )}
        </Card>

        <Card title="Analysis Metadata" icon={FileText} color="purple">
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Document Type</span>
              <span className="font-medium capitalize">
                {analysisMetadata?.documentType?.replace(/_/g, " ") || "Unknown"}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Analysis Version</span>
              <span className="font-medium">
                {analysisMetadata?.analysisVersion}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Charts Generated</span>
              <span className="font-medium">
                {analysisMetadata?.chartCount}
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-600">Last Updated</span>
              <span className="font-medium">
                {analysisMetadata?.timestamp}
              </span>
            </div>
          </div>
        </Card>

        <Card title="Export & Share" icon={Zap} color="amber">
          <div className="space-y-3">
            <button
              onClick={exportAnalysis}
              disabled={exporting}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 text-sm"
            >
              <Download size={14} />
              {exporting ? "Exporting..." : "Export Report"}
            </button>
            <button
              onClick={shareAnalysis}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm"
            >
              <Share2 size={14} />
              Share Analysis
            </button>
          </div>
        </Card>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
      {/* Enhanced Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg">
            <Sparkles size={isMobile ? 18 : 22} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              Smart Analysis
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
              Kiran Inspired - Sagar Developed insights from your data
              {analysisMetadata && !isMobile && (
                <span className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded">
                  {analysisMetadata.documentType.replace("_", " ")}
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {lastUpdated && !isMobile && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Clock size={14} />
              Last updated: {lastUpdated}
            </div>
          )}

          {currentAnalysis && !isMobile && (
            <div className="flex items-center gap-2">
              <button
                onClick={exportAnalysis}
                disabled={exporting}
                className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 text-sm"
              >
                <Download size={14} />
                {exporting ? "Exporting..." : "Export"}
              </button>

              <button
                onClick={shareAnalysis}
                className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm"
              >
                <Share2 size={14} />
                Share
              </button>
            </div>
          )}

          <button
            onClick={() => runAnalysis(session?.uploadId)}
            disabled={loading || !session?.uploadId}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all disabled:opacity-50 shadow-sm text-sm sm:text-base"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            {loading ? `Analyzing... ${Math.round(progress)}%` : "Re-Analyze"}
          </button>
        </div>
      </div>

      {/* Enhanced Progress Bar */}
      <AnimatePresence>
        {progress > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 overflow-hidden"
          >
            <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
              <span>Analysis Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
              <motion.div
                className="h-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full shadow-sm"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enhanced Error Display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-6 p-4 border border-red-200 bg-red-50 rounded-lg text-red-700 text-sm flex items-start gap-3"
        >
          <AlertTriangle className="flex-shrink-0 mt-0.5" size={16} />
          <div>
            <strong className="font-medium">Analysis Error</strong>
            <p className="mt-1">{error}</p>
          </div>
        </motion.div>
      )}

      {!currentAnalysis ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16 sm:py-20 border-2 border-dashed border-gray-300 rounded-2xl bg-gray-50/50"
        >
          <FileText size={isMobile ? 32 : 48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">
            No Analysis Data
          </h3>
          <p className="text-gray-500 max-w-md mx-auto mb-6 px-4 text-sm sm:text-base">
            Upload a file and analyze it to see AI-powered insights, visualizations, and recommendations.
          </p>
          <a
            href="/upload"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all shadow-sm text-sm sm:text-base"
          >
            <Upload size={16} /> Go to Upload
          </a>
        </motion.div>
      ) : isMobile ? (
        renderMobileView()
      ) : (
        renderDesktopView()
      )}
    </div>
  );
}