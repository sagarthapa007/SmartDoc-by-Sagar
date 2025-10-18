/**
 * 📊 sampleData.js
 * Mock data helpers for SmartDoc Analyzer
 */

export function buildRevenueTrend(rows) {
  const trend = [];
  for (let i = 0; i < 12; i++) {
    trend.push({
      month: `Month ${i + 1}`,
      revenue: Math.round(Math.random() * 10000 + 5000),
      profit: Math.round(Math.random() * 3000 + 2000),
    });
  }
  return trend;
}

export function topBy(rows, key = "Customer", metric = "revenue") {
  const top = [];
  for (let i = 0; i < 10; i++) {
    top.push({
      [key]: `${key} ${i + 1}`,
      [metric]: Math.round(Math.random() * 10000 + 2000),
    });
  }
  return top;
}

export function quickSummary(rows, metric = "revenue") {
  return {
    total: rows.length,
    avgRevenue: Math.round(Math.random() * 12000),
    topMetric: metric,
    comment: "Demo summary until live intelligence engine connects",
  };
}
