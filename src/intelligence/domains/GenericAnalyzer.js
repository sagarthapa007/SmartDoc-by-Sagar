export const GenericAnalyzer = {
  analyzeDomain(data, context) {
    const rows = Array.isArray(data) ? data : (data?.rows || []);
    const firstNumeric = context.metrics?.[0];
    let min=null, max=null, mean=0, n=0;
    rows.forEach(r => {
      const v = parseFloat(r[firstNumeric]);
      if (isNaN(v)) return;
      min = (min==null)?v:Math.min(min,v);
      max = (max==null)?v:Math.max(max,v);
      mean += v; n++;
    });
    mean = n? mean/n : 0;
    return { metrics: { primary: firstNumeric }, insights: { summary: `Generic analysis applied.` }, visuals: { summary: { min, max, mean, count: n } } };
  }
};
