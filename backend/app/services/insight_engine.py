import math
import statistics
from typing import Any, Dict, List, Optional


def try_float(v):
    try:
        return float(v)
    except Exception:
        return None


class InsightEngine:
    def run(
        self,
        headers: List[str],
        rows: List[Dict[str, Any]],
        text_blocks: Optional[List[str]],
        context: Dict[str, Any],
    ) -> Dict[str, Any]:
        persona = context.get("persona", "manager")
        data_type = context.get("data_type", "generic_dataset")

        # Compute simple quality metrics
        row_count = len(rows)
        col_count = len(headers or [])
        missing_cells = 0
        for r in rows:
            for h in headers or []:
                if r.get(h) in (None, "", "NaN"):
                    missing_cells += 1
        total_cells = max(row_count * max(col_count, 1), 1)
        missing_pct = round(missing_cells / total_cells * 100, 2)

        # numeric distribution (pick first numeric column if any)
        numeric_cols = [
            h for h in headers or [] if any(try_float(r.get(h)) is not None for r in rows)
        ]
        primary = numeric_cols[0] if numeric_cols else None
        values = [try_float(r.get(primary)) for r in rows] if primary else []
        values = [v for v in values if v is not None]
        summary_num = {}
        if values:
            summary_num = {
                "mean": round(statistics.mean(values), 3),
                "min": min(values),
                "max": max(values),
                "count": len(values),
            }

        quick_actions = []
        if missing_pct > 5:
            quick_actions.append(
                {
                    "id": "fill_missing",
                    "title": f"Fill missing values ({missing_pct}%)",
                    "severity": "medium",
                    "action_url": "/api/actions/fill_missing",
                    "preview": "Impute numeric with median, text with mode",
                }
            )
        # very naive duplicate check by email / customer
        key = None
        if "email" in [h.lower() for h in (headers or [])]:
            key = next((h for h in headers if h.lower() == "email"), None)
        elif "customer" in [h.lower() for h in (headers or [])]:
            key = next((h for h in headers if h.lower() == "customer"), None)
        if key:
            seen, dups = set(), 0
            for r in rows:
                k = r.get(key)
                if k in seen:
                    dups += 1
                else:
                    seen.add(k)
            if dups:
                quick_actions.append(
                    {
                        "id": "fix_duplicates",
                        "title": f"Fix {dups} duplicate {key} records",
                        "severity": "high",
                        "action_url": "/api/actions/deduplicate",
                        "preview": f"Will merge records with same {key}",
                    }
                )

        # Persona-specific narratives
        if persona == "executive":
            insights = {
                "critical": [
                    {"text": f"{missing_pct}% of data missing. Ensure pipeline reliability."}
                ],
                "opportunities": [
                    {
                        "text": f"Primary metric '{primary}' mean is {summary_num.get('mean') if summary_num else 'n/a'}."
                    }
                ],
            }
        elif persona == "manager":
            insights = {
                "critical": [{"text": f"Track data completeness ({missing_pct}%)."}],
                "opportunities": [{"text": "Use Explore to find high-value segments."}],
            }
        else:
            insights = {
                "critical": [{"text": "Run quality checks and remove outliers."}],
                "opportunities": [{"text": "Start with duplicates and missing fixes."}],
            }

        result = {
            "for_persona": persona,
            "quick_actions": quick_actions,
            "insights": insights,
            "charts": {
                "primary": {"type": "summary", "metric": primary, "numeric_summary": summary_num}
            },
            "summary": f"Analyzed {row_count} rows, {col_count} columns (missing {missing_pct}%).",
            "quality": {"missing_pct": missing_pct, "row_count": row_count, "col_count": col_count},
            "technical": {"numeric": summary_num},
            "business": {"data_type": data_type},
            "narrative": {
                "technical": {"summary": {"rowCount": row_count, "colCount": col_count}},
                "business": {"context": {"dataType": data_type}},
                "quality": {"missingPct": missing_pct},
            },
        }
        return result
