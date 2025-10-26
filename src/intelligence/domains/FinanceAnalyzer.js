export const FinanceAnalyzer = {
  analyzeDomain(data, context) {
    const rows = Array.isArray(data) ? data : data?.rows || [];
    const revenueKey =
      context.metrics?.find((m) =>
        /revenue|sales|income|turnover|amount|amt|rev/i.test(m),
      ) || context.metrics?.[0];
    const dateKey = context.dateDimension;
    const monthly = {};
    rows.forEach((r) => {
      const d = new Date(r[dateKey] || r.Date || r.date);
      if (isNaN(d)) return;
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const v = parseFloat(r[revenueKey]) || 0;
      monthly[k] = (monthly[k] || 0) + v;
    });
    const trend = Object.entries(monthly)
      .sort(([a], [b]) => (a > b ? 1 : -1))
      .map(([month, revenue]) => ({ month, revenue }));
    const entKey =
      context.entities.customer ||
      context.entities.product ||
      context.entities.category;
    const byEnt = {};
    rows.forEach((r) => {
      const k = r[entKey] || "Unknown";
      const v = parseFloat(r[revenueKey]) || 0;
      byEnt[k] = (byEnt[k] || 0) + v;
    });
    const ranking = Object.entries(byEnt)
      .map(([name, revenue]) => ({ name, revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
    return {
      metrics: { primary: revenueKey },
      insights: { summary: `Finance/sales detected.` },
      visuals: { trend, ranking },
    };
  },
};
