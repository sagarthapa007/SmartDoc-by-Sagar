import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, Activity, BarChart3, Brain, AlertTriangle, 
  RefreshCw, TrendingUp, Database, Lightbulb, Zap,
  CheckCircle, Clock, AlertCircle, Upload
} from "lucide-react";
import { useAnalyzeStore } from "@/store/analyze.store.js";

// Panels
import DataStructurePanel from "@/components/analyzer/DataStructurePanel.jsx";
import QualityPanel from "@/components/analyzer/QualityPanel.jsx";
import QualityScore from "@/components/analyzer/QualityScore.jsx";
import CorrelationFinder from "@/components/analyzer/CorrelationFinder.jsx";
import ChartBuilderPanel from "@/components/analyzer/ChartBuilderPanel.jsx";

// Enhanced Card component with status indicators
const Card = ({ title, icon: Icon, children, right, status, className = "" }) => {
  const statusConfig = {
    loading: { color: "blue", icon: Clock },
    success: { color: "green", icon: CheckCircle },
    warning: { color: "amber", icon: AlertCircle },
    error: { color: "red", icon: AlertTriangle }
  };

  const StatusIcon = status ? statusConfig[status]?.icon : null;
  const statusColor = status ? statusConfig[status]?.color : "gray";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm hover:shadow-md transition-shadow ${className}`}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2">
          {Icon && (
            <Icon 
              size={18} 
              className={`${
                status ? `text-${statusColor}-600` : 'text-blue-600'
              }`} 
            />
          )}
          <h3 className="text-sm font-semibold">{title}</h3>
          {StatusIcon && (
            <StatusIcon 
              size={14} 
              className={`text-${statusColor}-500 animate-pulse`} 
            />
          )}
        </div>
        {right}
      </div>
      <div className="p-4">{children}</div>
    </motion.div>
  );
};

// Loading shimmer component
const LoadingShimmer = () => (
  <div className="space-y-3">
    {[...Array(3)].map((_, i) => (
      <div key={i} className="flex gap-3 items-center">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse flex-1" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-1/4" />
      </div>
    ))}
  </div>
);

// Insight card component
const InsightCard = ({ insight, index }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: index * 0.1 }}
    className="p-3 rounded-lg border border-gray-100 dark:border-gray-800 bg-gradient-to-r from-blue-50/50 to-transparent dark:from-blue-950/20 hover:shadow-sm transition-all"
  >
    <div className="flex items-start gap-3">
      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mt-0.5">
        <Lightbulb size={12} className="text-blue-600 dark:text-blue-400" />
      </div>
      <div className="flex-1">
        <p className="text-sm leading-relaxed">
          {typeof insight === 'string' ? insight : insight?.text ?? JSON.stringify(insight)}
        </p>
        {insight?.confidence && (
          <div className="flex items-center gap-2 mt-2">
            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
              <div 
                className="bg-green-500 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${insight.confidence * 100}%` }}
              />
            </div>
            <span className="text-xs text-gray-500">
              {Math.round(insight.confidence * 100)}% confidence
            </span>
          </div>
        )}
      </div>
    </div>
  </motion.div>
);

// Metric card component
const MetricCard = ({ label, value, icon: Icon, trend, description }) => (
  <div className="flex items-center justify-between p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-white/50 dark:bg-gray-800/50">
    <div className="flex items-center gap-3">
      <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
        <Icon size={16} className="text-blue-600 dark:text-blue-400" />
      </div>
      <div>
        <div className="text-sm font-medium">{label}</div>
        {description && (
          <div className="text-xs text-gray-500">{description}</div>
        )}
      </div>
    </div>
    <div className="text-right">
      <div className="font-bold text-lg">{value}</div>
      {trend && (
        <div className={`text-xs ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
          {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
        </div>
      )}
    </div>
  </div>
);

export default function Analyze() {
  const {
    dataset,
    schema, quality, domain,
    insights, suggestedCharts, correlations,
    loading, error,
    detectSchemaAndQuality, analyze, runCorrelate
  } = useAnalyzeStore();

  const [ranOnce, setRanOnce] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);

  // Enhanced auto-run with progress simulation
  useEffect(() => {
    if (!dataset) return;

    let progressInterval;
    const runAnalysis = async () => {
      setAnalysisProgress(10);
      
      await detectSchemaAndQuality();
      setAnalysisProgress(50);
      
      await analyze();
      setAnalysisProgress(100);
      
      setTimeout(() => setAnalysisProgress(0), 1000);
      setRanOnce(true);
    };

    // Simulate progress for better UX
    progressInterval = setInterval(() => {
      setAnalysisProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + 10;
      });
    }, 300);

    runAnalysis();

    return () => {
      if (progressInterval) clearInterval(progressInterval);
    };
  }, [dataset?.headers?.join(","), dataset?.rows?.length]);

  const headers = dataset?.headers || [];
  const rows = dataset?.rows || [];

  const qualityIssues = useMemo(() => {
    const missing = quality?.missing || {};
    return Object.values(missing).reduce((a, b) => a + (b || 0), 0);
  }, [quality]);

  const dataTypes = useMemo(() => {
    if (!schema?.columns) return { numeric: 0, categorical: 0 };
    return {
      numeric: schema.columns.filter(col => col.type === 'number').length,
      categorical: schema.columns.filter(col => col.type === 'string').length
    };
  }, [schema]);

  const handleReanalyze = async () => {
    setAnalysisProgress(10);
    await detectSchemaAndQuality();
    await analyze();
    setAnalysisProgress(0);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 pb-16">
      {/* Enhanced Hero Section */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between gap-4 mt-4 mb-6"
      >
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600">
              <Sparkles className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Smart Analysis</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                AI-powered insights and automated data profiling
              </p>
            </div>
          </div>
          
          {/* Progress Bar */}
          {analysisProgress > 0 && (
            <div className="mt-4 max-w-md">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Analyzing data...</span>
                <span>{analysisProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <motion.div 
                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                  initial={{ width: 0 }}
                  animate={{ width: `${analysisProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleReanalyze}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            {loading ? "Analyzing..." : "Re-analyze"}
          </motion.button>
        </div>
      </motion.div>

      {/* Status Messages */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="mb-4 rounded-xl border border-blue-200/60 bg-blue-50/60 dark:border-blue-900 dark:bg-blue-950/30 px-4 py-3 text-sm"
          >
            <div className="flex items-center gap-3">
              <Zap size={16} className="text-blue-600 animate-pulse" />
              <div>
                <div className="font-medium">Running deep analysis</div>
                <div className="text-blue-700 dark:text-blue-300">
                  Crunching stats, discovering correlations, and generating AI insights...
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="mb-4 rounded-xl border border-red-200/60 bg-red-50/60 dark:border-red-900 dark:bg-red-950/30 px-4 py-3 text-sm"
          >
            <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
              <AlertTriangle size={16}/>
              <span>{error}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Grid */}
      {dataset ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Data Overview */}
          <div className="space-y-6">
            <Card 
              title="Data Overview" 
              icon={Database}
              status={ranOnce ? "success" : "loading"}
            >
              <div className="space-y-3">
                <MetricCard
                  label="Total Rows"
                  value={rows.length.toLocaleString()}
                  icon={Activity}
                  description="Records in dataset"
                />
                <MetricCard
                  label="Columns"
                  value={headers.length}
                  icon={BarChart3}
                  description={`${dataTypes.numeric} numeric, ${dataTypes.categorical} categorical`}
                />
                <MetricCard
                  label="Data Domain"
                  value={domain || "—"}
                  icon={TrendingUp}
                  description="Identified dataset type"
                />
                <MetricCard
                  label="Quality Issues"
                  value={qualityIssues}
                  icon={AlertTriangle}
                  description="Missing values detected"
                  trend={-10} // Example improvement trend
                />
              </div>
            </Card>

            <Card 
              title="Data Quality" 
              icon={AlertTriangle}
              status={quality ? "success" : "loading"}
            >
              <div className="grid grid-cols-1 gap-4">
                <QualityScore quality={quality} />
                {quality ? (
                  <QualityPanel quality={quality} />
                ) : (
                  <LoadingShimmer />
                )}
              </div>
            </Card>

            <Card 
              title="Data Structure" 
              icon={BarChart3}
              status={schema ? "success" : "loading"}
            >
              {schema ? (
                <DataStructurePanel schema={Array.isArray(schema) ? schema : schema?.columns ?? []} />
              ) : (
                <LoadingShimmer />
              )}
            </Card>
          </div>

          {/* Middle Column - Insights & Analysis */}
          <div className="space-y-6">
            <Card 
              title="AI Insights" 
              icon={Brain}
              status={insights?.length ? "success" : ranOnce ? "warning" : "loading"}
              right={
                insights?.length && (
                  <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                    {insights.length} insights
                  </span>
                )
              }
            >
              {insights?.length ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {insights.map((insight, i) => (
                    <InsightCard key={i} insight={insight} index={i} />
                  ))}
                </div>
              ) : ranOnce ? (
                <div className="text-center py-8 text-gray-500">
                  <Lightbulb size={32} className="mx-auto mb-3 opacity-50" />
                  <div>No significant patterns detected</div>
                  <div className="text-sm">Try adding more data or different metrics</div>
                </div>
              ) : (
                <LoadingShimmer />
              )}
            </Card>

            <Card 
              title="Correlation Finder" 
              icon={TrendingUp}
              status={correlations ? "success" : "loading"}
            >
              <CorrelationFinder 
                dataset={rows} 
                onAuto={(threshold) => runCorrelate(threshold)} 
              />
            </Card>
          </div>

          {/* Right Column - Visualization */}
          <div className="space-y-6">
            <Card 
              title="Suggested Charts" 
              icon={BarChart3}
              status={suggestedCharts?.length ? "success" : ranOnce ? "warning" : "loading"}
              right={
                suggestedCharts?.length ? (
                  <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                    {suggestedCharts.length} ready
                  </span>
                ) : null
              }
            >
              {suggestedCharts?.length ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {suggestedCharts.map((chart, i) => (
                    <motion.div
                      key={chart.id || `${chart.type}-${chart.x}-${chart.y}`}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.1 }}
                      className="rounded-lg border border-gray-100 dark:border-gray-800 p-3 hover:border-blue-200 dark:hover:border-blue-800 cursor-pointer transition-all group"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <div className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                          {chart.type}
                        </div>
                        <div className="flex-1" />
                        <Sparkles size={12} className="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <div className="text-sm font-medium">{chart.title || `${chart.x} vs ${chart.y}`}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {chart.reason || "High correlation detected"}
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : ranOnce ? (
                <div className="text-center py-8 text-gray-500">
                  <BarChart3 size={32} className="mx-auto mb-3 opacity-50" />
                  <div>No chart suggestions yet</div>
                  <div className="text-sm">Build a custom chart to get started</div>
                </div>
              ) : (
                <LoadingShimmer />
              )}
            </Card>

            <Card 
              title="Custom Chart Builder" 
              icon={Sparkles}
              status="success"
            >
              <ChartBuilderPanel headers={headers} rows={rows} />
            </Card>
          </div>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-xl border border-gray-200 dark:border-gray-800 p-8 text-center"
        >
          <Database size={48} className="mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold mb-2">No Dataset Found</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Please upload a file to begin analysis
          </p>
          <motion.a
            href="/upload"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
          >
            <Upload size={16} />
            Go to Upload
          </motion.a>
        </motion.div>
      )}
    </div>
  );
}