import statistics
from typing import Any, Dict, List


def _to_float(v):
    try:
        return float(v)
    except Exception:
        return None


def _numeric_summary(headers: List[str], rows: List[dict]):
    numeric_cols = [h for h in headers if any(_to_float(r.get(h)) is not None for r in rows)]
    if not numeric_cols:
        return {"primary": None, "summary": {}}
    primary = numeric_cols[0]
    vals = [_to_float(r.get(primary)) for r in rows]
    vals = [v for v in vals if v is not None]
    if not vals:
        return {"primary": primary, "summary": {}}
    return {
        "primary": primary,
        "summary": {
            "mean": round(statistics.mean(vals), 3),
            "min": min(vals),
            "max": max(vals),
            "count": len(vals),
        },
    }


def persona_insights(
    headers: List[str], rows: List[dict], data_type: str, persona: str
) -> Dict[str, Any]:
    num = _numeric_summary(headers, rows)
    primary = num.get("primary")
    summary = num.get("summary", {})

    base = {"critical": [], "opportunities": []}

    # Domain-specific hints
    if data_type == "sales_transactional":
        base["opportunities"].append({"text": "Consider segmenting top customers for upsell."})
    elif data_type == "hr_roster":
        base["opportunities"].append({"text": "Analyze headcount by department and grade."})
    elif data_type == "financial_statement":
        base["opportunities"].append({"text": "Review expense breakdown to optimize cost centers."})

    # Persona overlays
    if persona == "executive":
        if summary:
            base["critical"].append(
                {
                    "text": f"Primary metric '{primary}' mean is {summary.get('mean')} (range {summary.get('min')}–{summary.get('max')})."
                }
            )
        base["opportunities"].append({"text": "Track KPIs and set alerts on major deviations."})
    elif persona == "manager":
        base["critical"].append({"text": "Ensure team-level performance metrics are defined."})
        base["opportunities"].append({"text": "Use Explore to build weekly performance views."})
    else:  # junior
        base["critical"].append(
            {"text": "Fix missing values and duplicates before deeper analysis."}
        )
        base["opportunities"].append({"text": "Start with distributions and correlations."})

    return base
