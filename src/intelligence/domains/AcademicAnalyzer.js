export const AcademicAnalyzer = {
  analyzeDomain(data, context) {
    const rows = Array.isArray(data) ? data : (data?.rows || []);
    const metric = context.metrics?.find(m => /grade|score|gpa/i.test(m)) || context.metrics?.[0];
    const subjectKey = ["Subject","Course","subject","course"].find(k => rows[0] && k in rows[0]) || context.entities.category;
    const box = {};
    rows.forEach(r => {
      const s = r[subjectKey];
      const v = parseFloat(r[metric]) || 0;
      if (!s) return;
      if (!box[s]) box[s] = [];
      box[s].push(v);
    });
    const ranking = Object.entries(box).map(([name, arr]) => ({ name, average: arr.reduce((a,b)=>a+b,0)/(arr.length||1) })).sort((a,b)=>b.average-a.average);
    return { metrics: { primary: metric }, insights: { summary: `Academic data detected.` }, visuals: { ranking } };
  }
};
