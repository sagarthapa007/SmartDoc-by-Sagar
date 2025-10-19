
from typing import Dict, Any, List
import statistics

def _to_float(v):
    try: return float(v)
    except Exception: return None

def explain(headers: List[str], rows: List[dict], question: str) -> Dict[str, Any]:
    q = (question or "").lower()
    # Very lightweight heuristic explainer (no external LLM calls)
    # Looks for month/date or numeric-related questions.
    numeric_cols = [h for h in headers if any(_to_float(r.get(h)) is not None for r in rows)]
    date_cols = [h for h in headers if "date" in h.lower()]
    notes = []
    if "why" in q and ("drop" in q or "decrease" in q):
        if numeric_cols and date_cols:
            # Find month-over-month change on first numeric
            val_col = numeric_cols[0]
            date_col = date_cols[0]
            # Group by date string
            buckets = {}
            for r in rows:
                d = str(r.get(date_col) or "").strip()[:7]  # YYYY-MM
                v = _to_float(r.get(val_col))
                if v is None: continue
                buckets.setdefault(d, []).append(v)
            series = sorted(((k, sum(vs)) for k,vs in buckets.items()), key=lambda x: x[0])
            changes = []
            for i in range(1, len(series)):
                prev, cur = series[i-1][1], series[i][1]
                if prev:
                    pct = round((cur - prev) / prev * 100, 2)
                    changes.append((series[i][0], pct))
            if changes:
                worst = min(changes, key=lambda x: x[1])
                notes.append({"text": f"Largest relative drop found in {worst[0]}: {worst[1]}% vs previous period.", "detail": "MoM on first numeric column."})
        else:
            notes.append({"text": "Insufficient date or numeric columns to diagnose a drop."})
    elif "top" in q and ("customer" in q or "product" in q):
        # Find likely dimension and rank by first numeric
        val_col = numeric_cols[0] if numeric_cols else None
        dim_col = next((h for h in headers if h.lower() in ("customer","product","category")), None)
        if val_col and dim_col:
            agg = {}
            for r in rows:
                k = str(r.get(dim_col) or "").strip()
                v = _to_float(r.get(val_col))
                if not k or v is None: continue
                agg[k] = agg.get(k, 0.0) + v
            ranked = sorted(agg.items(), key=lambda kv: kv[1], reverse=True)[:5]
            notes.append({"text": f"Top contributors by {dim_col}:", "items": [{"name": k, "total": v} for k,v in ranked]})
        else:
            notes.append({"text": "Could not find suitable dimension/value columns for ranking."})
    else:
        notes.append({"text": "No specific heuristic matched the question; try Explore or refine question."})
    return {"explanation": notes}
