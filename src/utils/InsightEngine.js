/**
 * 🧠 SmartDoc Insight Engine (Offline Narrative Generator)
 * --------------------------------------------------------
 * Optimized version with performance enhancements and better caching
 * while preserving all original functionality.
 */

import { mean, median, standardDeviation } from "simple-statistics";

// 🔧 Configuration
const CONFIG = {
  maxPreviewColumns: 3,
  decimalPrecision: 2
};

// 🎯 Memoization cache
const memoCache = new Map();

/**
 * Helper: Check if a value is numeric with enhanced validation
 */
function isNumeric(val) {
  if (val === null || val === undefined || val === "") return false;
  
  const num = parseFloat(val);
  return !isNaN(num) && isFinite(val);
}

/**
 * Helper: Safely extract numeric column data with caching
 */
function getNumericColumn(data, key) {
  const cacheKey = `numeric_${key}_${data.length}`;
  if (memoCache.has(cacheKey)) {
    return memoCache.get(cacheKey);
  }

  const result = data
    .map((r) => parseFloat(r[key]))
    .filter((v) => isNumeric(v));

  memoCache.set(cacheKey, result);
  return result;
}

/**
 * Helper: Efficient column type detection
 */
function detectColumnType(data, header) {
  const cacheKey = `type_${header}_${data.length}`;
  if (memoCache.has(cacheKey)) {
    return memoCache.get(cacheKey);
  }

  // Sample checking for efficiency with large datasets
  const sampleSize = Math.min(100, data.length);
  const sample = data.slice(0, sampleSize);
  
  const hasNumeric = sample.some((row) => isNumeric(row[header]));
  const type = hasNumeric ? 'numeric' : 'categorical';

  memoCache.set(cacheKey, type);
  return type;
}

/**
 * 🧩 Generate Summary Statistics (Optimized)
 */
function summarizeDataset(data) {
  const cacheKey = `summary_${data.rows.length}_${data.headers.length}`;
  if (memoCache.has(cacheKey)) {
    return memoCache.get(cacheKey);
  }

  const summary = {
    totalRows: data.rows.length,
    totalColumns: data.headers.length,
    numericColumns: [],
    categoricalColumns: [],
  };

  // Batch process columns for better performance
  data.headers.forEach((header) => {
    const columnType = detectColumnType(data.rows, header);
    
    if (columnType === 'numeric') {
      summary.numericColumns.push(header);
    } else {
      summary.categoricalColumns.push(header);
    }
  });

  memoCache.set(cacheKey, summary);
  return summary;
}

/**
 * 🔍 Generate Statistical Insights for numeric columns (Optimized)
 */
function numericInsights(data, numericCols) {
  const cacheKey = `insights_${data.rows.length}_${numericCols.join('_')}`;
  if (memoCache.has(cacheKey)) {
    return memoCache.get(cacheKey);
  }

  const results = numericCols.map((col) => {
    const values = getNumericColumn(data.rows, col);
    if (!values.length) return null;

    // Batch calculations for better performance
    const stats = {
      column: col,
      mean: mean(values).toFixed(CONFIG.decimalPrecision),
      median: median(values).toFixed(CONFIG.decimalPrecision),
      std: standardDeviation(values).toFixed(CONFIG.decimalPrecision),
      min: Math.min(...values).toFixed(CONFIG.decimalPrecision),
      max: Math.max(...values).toFixed(CONFIG.decimalPrecision),
      count: values.length
    };

    return stats;
  }).filter(Boolean);

  memoCache.set(cacheKey, results);
  return results;
}

/**
 * Helper: Format column list for display
 */
function formatColumnList(columns, maxItems = CONFIG.maxPreviewColumns) {
  if (!columns.length) return '';
  
  const preview = columns.slice(0, maxItems);
  const remaining = columns.length - maxItems;
  
  let formatted = preview.join(", ");
  if (remaining > 0) {
    formatted += `, and ${remaining} other${remaining > 1 ? 's' : ''}`;
  }
  
  return formatted;
}

/**
 * Helper: Generate quality assessment
 */
function assessDataQuality(rowCount) {
  if (rowCount > 10000) return "excellent with a very large sample size";
  if (rowCount > 1000) return "robust with a large sample size";
  if (rowCount > 100) return "moderate with a decent sample size";
  return "limited due to small sample size";
}

/**
 * 🧠 Generate Narrative Summary (Main Function - Optimized)
 */
export function generateNarrative(data) {
  // Input validation
  if (!data || !data.rows?.length) {
    return "No dataset available for narrative generation.";
  }

  const cacheKey = `narrative_${data.rows.length}_${data.headers?.length || 0}`;
  if (memoCache.has(cacheKey)) {
    return memoCache.get(cacheKey);
  }

  // Generate insights
  const summary = summarizeDataset(data);
  const numericStats = numericInsights(data, summary.numericColumns);

  // Build narrative efficiently
  const narrativeParts = [
    `📊 Your dataset contains **${summary.totalRows.toLocaleString()} rows** and **${summary.totalColumns} columns**.`
  ];

  // Add numeric insights
  if (summary.numericColumns.length > 0) {
    narrativeParts.push(
      `🧮 There are **${summary.numericColumns.length} numeric fields**, including ${formatColumnList(summary.numericColumns)}.`
    );

    const primaryStat = numericStats[0];
    if (primaryStat) {
      narrativeParts.push(
        `For example, the field **${primaryStat.column}** ranges from ${primaryStat.min} to ${primaryStat.max}, with an average of ${primaryStat.mean}.`
      );
    }
  } else {
    narrativeParts.push("No purely numeric columns were detected.");
  }

  // Add categorical insights
  if (summary.categoricalColumns.length > 0) {
    narrativeParts.push(
      `💬 The dataset also contains **${summary.categoricalColumns.length} categorical fields**, such as ${formatColumnList(summary.categoricalColumns)}.`
    );
  }

  // Add quality assessment
  narrativeParts.push(
    `⚙️ Data quality appears ${assessDataQuality(data.rows.length)}.`,
    `The analysis was generated locally, without backend AI inference.`
  );

  const finalNarrative = narrativeParts.join('\n\n');
  memoCache.set(cacheKey, finalNarrative);
  
  return finalNarrative;
}

/**
 * 🧹 Utility function to clear cache (useful for memory management)
 */
export function clearNarrativeCache() {
  memoCache.clear();
}

/**
 * 📊 Get cache statistics (for debugging/monitoring)
 */
export function getCacheStats() {
  return {
    size: memoCache.size,
    keys: Array.from(memoCache.keys())
  };
}

/**
 * 🧩 Extended version for integration in backendClient fallback
 * (Preserving exact original export structure)
 */
export default {
  generateNarrative,
  clearNarrativeCache,
  getCacheStats
};