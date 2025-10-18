/**
 * 🧭 UniversalPatternDetector.js
 * Domain-agnostic detector for ANY structured dataset.
 */
export class UniversalPatternDetector {
  static analyze(data, sampleSize = 2000) {
    const rows = Array.isArray(data) ? data : (data?.rows || []);
    const headers = Array.isArray(data) ? Object.keys(rows[0] || {}) : (data?.headers || Object.keys(rows[0] || {}));
    const sample = rows.slice(0, Math.min(sampleSize, rows.length));

    const headerInfo = headers.map(h => ({
      name: h,
      roleHints: this.roleHintsFromHeader(h),
      type: this.inferType(sample, h),
      uniqueness: this.uniqueness(sample, h),
      stats: this.columnStats(sample, h)
    }));

    const domains = this.scoreDomains(headerInfo);
    const top = domains.sort((a,b)=>b.score-a.score)[0] || { domain: "generic", score: 0.5 };

    const metrics = this.detectMetrics(headerInfo);
    const entities = this.detectEntities(headerInfo);

    return {
      domain: top.domain,
      confidence: Number(Math.min(1, Math.max(0, top.score))).toFixed(2) * 1,
      headers,
      entities,
      metrics,
      dateDimension: this.findDate(headerInfo),
      suggestedAnalyses: this.suggestAnalyses(top.domain, headerInfo, metrics),
      headerInfo,
      analysisTimestamp: new Date().toISOString()
    };
  }

  static roleHintsFromHeader(h) {
    const s = String(h).toLowerCase();
    const map = {
      date: /(date|time|month|year|period|week|day)/,
      finance_rev: /(revenue|sales|income|turnover|amount|amt|rev|credit)/,
      finance_cost: /(cost|expense|debit|fee|charge|cogs|payment)/,
      personal_money: /(expense|category|budget|wallet|account|txn|transaction)/,
      hr_person: /(employee|emp|staff|hr|payroll|salary|wage|comp|benefit)/,
      product: /(product|item|sku|service|brand|category|desc|description)/,
      customer: /(customer|client|account|buyer|party|contact|name)/,
      inventory: /(stock|inventory|reorder|qty|quantity|warehouse|lot)/,
      health: /(weight|calorie|steps|bpm|heartrate|sleep|fat|protein|carb)/,
      academic: /(grade|score|subject|exam|term|gpa|credit)/,
      geo: /(lat|lng|lon|latitude|longitude|city|state|region|country|zone|district)/,
      id: /(id|code|uuid|number|num|ref|key)/,
    };
    const hints = [];
    for (const [k, re] of Object.entries(map)) if (re.test(s)) hints.push(k);
    return hints;
  }

  static inferType(rows, key) {
    const values = rows.map(r => r?.[key]).filter(v => v != null && v !== "");
    if (!values.length) return "unknown";
    const num = values.filter(v => !isNaN(parseFloat(String(v).replace(/,/g, ""))));
    const bool = values.filter(v => /^(true|false|yes|no|1|0|y|n)$/i.test(String(v)));
    const date = values.filter(v => {
      const s = String(v);
      return /^\d{4}[-/]\d{2}[-/]\d{2}/.test(s) || !isNaN(Date.parse(s));
    });
    if (date.length / values.length > 0.6) return "date";
    if (bool.length / values.length > 0.8) return "boolean";
    if (num.length / values.length > 0.7) return "numeric";
    if (num.length / values.length > 0.3) return "mixed";
    return "text";
  }

  static uniqueness(rows, key) {
    const vals = rows.map(r => r?.[key]).filter(v => v != null && v !== "");
    if (!vals.length) return 0;
    const set = new Set(vals);
    return (set.size / vals.length) * 100;
  }

  static columnStats(rows, key) {
    const vals = rows.map(r => r?.[key]).filter(v => v != null && v !== "");
    const nums = vals.map(v => parseFloat(String(v).replace(/,/g, ""))).filter(v => !isNaN(v));
    const sum = nums.reduce((a,b)=>a+b,0);
    const mean = nums.length ? sum/nums.length : 0;
    const min = nums.length ? Math.min(...nums) : null;
    const max = nums.length ? Math.max(...nums) : null;
    return { count: vals.length, numericCount: nums.length, sample: vals.slice(0,5), sum, mean, min, max };
  }

  static findDate(info) {
    return info.find(c => c.type === "date" || c.roleHints.includes("date"))?.name || null;
  }

  static detectMetrics(info) {
    const candidates = info.filter(c => c.type === "numeric" && c.uniqueness < 90);
    const financeFirst = candidates.sort((a,b)=>{
      const as = (a.roleHints.includes("finance_rev") || a.roleHints.includes("finance_cost")) ? 1 : 0;
      const bs = (b.roleHints.includes("finance_rev") || b.roleHints.includes("finance_cost")) ? 1 : 0;
      return bs - as || (b.stats.sum - a.stats.sum);
    });
    return financeFirst.map(c => c.name);
  }

  static detectEntities(info) {
    const entities = {};
    const find = (roles) => info.find(c => roles.some(r => c.roleHints.includes(r)))?.name;
    entities.customer = find(["customer"]);
    entities.product  = find(["product"]);
    entities.location = find(["geo"]);
    entities.person   = find(["hr_person"]);
    entities.category = find(["personal_money","product"]) || info.find(c => c.type==="text" && c.uniqueness<60)?.name;
    return entities;
  }

  static scoreDomains(info) {
    const score = (checks) => checks.reduce((s, c)=> s + (c?1:0), 0);
    const has = (hint) => info.some(c => c.roleHints.includes(hint));
    const manyNumeric = info.filter(c => c.type==="numeric").length >= 3;
    const hasDate = info.some(c => c.type==="date");
    const candidates = [
      { domain: "personal_finance", score: score([has("personal_money"), manyNumeric, hasDate]) + (has("finance_cost")||has("finance_rev")?0.5:0) },
      { domain: "finance",          score: score([has("finance_rev")||has("finance_cost"), manyNumeric, hasDate]) + (has("customer")?0.25:0) },
      { domain: "inventory",        score: score([has("inventory"), has("product"), manyNumeric]) + (hasDate?0.25:0) },
      { domain: "hr",               score: score([has("hr_person"), manyNumeric, hasDate]) },
      { domain: "health",           score: score([has("health"), manyNumeric, hasDate]) },
      { domain: "academic",         score: score([has("academic"), manyNumeric, hasDate]) },
      { domain: "business_sales",   score: score([has("customer"), has("product"), has("finance_rev")]) + (hasDate?0.25:0) },
      { domain: "generic",          score: 1 + (manyNumeric?0.25:0) + (hasDate?0.25:0) }
    ];
    const max = Math.max(...candidates.map(c=>c.score)) || 1;
    return candidates.map(c => ({ domain: c.domain, score: Math.min(1, c.score / (max + 0.0001)) }));
  }

  static suggestAnalyses(domain, info, metrics) {
    const suggestions = new Set();
    const hasDate = info.some(c => c.type === "date");
    const hasManyNum = info.filter(c=>c.type==="numeric").length >= 3;
    if (hasDate) suggestions.add("time_series_analysis");
    if (hasManyNum) suggestions.add("correlation_analysis");
    if (metrics?.length) suggestions.add("top_n_ranking");
    switch (domain) {
      case "personal_finance": suggestions.add("budget_vs_expense").add("category_trends"); break;
      case "finance": suggestions.add("ratio_analysis").add("cashflow_forecast"); break;
      case "inventory": suggestions.add("stock_turnover").add("reorder_points"); break;
      case "hr": suggestions.add("salary_bands").add("headcount_trends"); break;
      case "health": suggestions.add("habit_consistency").add("progress_tracking"); break;
      case "academic": suggestions.add("grade_trends").add("subject_performance"); break;
      default: suggestions.add("generic_summary");
    }
    return Array.from(suggestions);
  }
}
