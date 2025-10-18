/**
 * 💬 NLQEngine.js
 * Parses plain English queries into structured intents
 */
export class NLQEngine {
  static parse(query) {
    const intents = {
      trend: /trend|growth|over time/i,
      compare: /compare|versus|vs/i,
      rank: /top|best|worst|ranking|leader/i,
      correlation: /correlation|relation|linked|associated/i
    };
    const intent =
      Object.entries(intents).find(([_, p]) => p.test(query))?.[0] || "general";

    const metricMatch = query.match(/\b(revenue|sales|profit|cost|quantity|margin)\b/i);
    const entityMatch = query.match(/\b(customer|product|region)\b/i);
    return {
      intent,
      metric: metricMatch ? metricMatch[1].toLowerCase() : null,
      entity: entityMatch ? entityMatch[1].toLowerCase() : null
    };
  }

  static execute(query, context) {
    const parsed = this.parse(query);
    return { ok: true, parsed, message: `Detected intent: ${parsed.intent}` };
  }
}
