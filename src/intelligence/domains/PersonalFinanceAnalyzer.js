export const PersonalFinanceAnalyzer = {
  analyzeDomain(data, context) {
    const rows = Array.isArray(data) ? data : data?.rows || [];
    const dateKey = context.dateDimension;
    const catKey = context.entities.category || "Category";
    const metric = (context.metrics && context.metrics[0]) || "Amount";
    const agg = {};
    rows.forEach((r) => {
      const d = new Date(r[dateKey] || r.date || r.Date || r.period);
      if (isNaN(d)) return;
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const val = parseFloat(r[metric]) || 0;
      agg[k] = (agg[k] || 0) + val;
    });
    const trend = Object.entries(agg)
      .sort(([a], [b]) => (a > b ? 1 : -1))
      .map(([month, amount]) => ({ month, amount }));
    const cat = {};
    rows.forEach((r) => {
      const name = r[catKey];
      if (!name) return;
      const val = parseFloat(r[metric]) || 0;
      cat[name] = (cat[name] || 0) + val;
    });
    const ranking = Object.entries(cat)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, amount]) => ({ name, amount }));
    return {
      metrics: { primary: metric },
      insights: { summary: `Personal finance detected. ${rows.length} rows.` },
      visuals: { trend, ranking },
    };
  },
};
