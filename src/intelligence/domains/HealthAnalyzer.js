export const HealthAnalyzer = {
  analyzeDomain(data, context) {
    const rows = Array.isArray(data) ? data : (data?.rows || []);
    const dateKey = context.dateDimension;
    const metric = context.metrics?.find(m => /weight|bpm|calorie|steps/i.test(m)) || context.metrics?.[0];
    const map = {};
    rows.forEach(r => {
      const d = new Date(r[dateKey] || r.date || r.Date);
      if (isNaN(d)) return;
      const key = d.toISOString().slice(0,10);
      const val = parseFloat(r[metric]) || 0;
      map[key] = (map[key] || 0) + val;
    });
    const trend = Object.entries(map).sort(([a],[b])=>a>b?1:-1).map(([date, value])=>({ date, value }));
    return { metrics: { primary: metric }, insights: { summary: `Health data detected.` }, visuals: { trend } };
  }
};
