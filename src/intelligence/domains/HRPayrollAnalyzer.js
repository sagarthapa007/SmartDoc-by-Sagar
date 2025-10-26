export const HRPayrollAnalyzer = {
  analyzeDomain(data, context) {
    const rows = Array.isArray(data) ? data : data?.rows || [];
    const salaryKey =
      context.metrics?.find((m) => /salary|wage|comp|pay/i.test(m)) ||
      context.metrics?.[0];
    const deptKey = [
      "Department",
      "Dept",
      "Team",
      "department",
      "dept",
      "team",
    ].find((k) => rows[0] && k in rows[0]);
    const groups = {};
    rows.forEach((r) => {
      const k = deptKey ? r[deptKey] : "All";
      const v = parseFloat(r[salaryKey]) || 0;
      groups[k] = (groups[k] || 0) + v;
    });
    const ranking = Object.entries(groups)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total);
    return {
      metrics: { primary: salaryKey },
      insights: { summary: `HR/Payroll detected.` },
      visuals: { ranking },
    };
  },
};
