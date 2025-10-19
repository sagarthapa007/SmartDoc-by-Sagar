
from typing import List, Dict, Any

NUMERIC_HINTS = {"amount","revenue","qty","quantity","price","value","score","count","cost"}
DATE_HINTS = {"date","day","month","year","timestamp","period"}
CATEGORICAL_HINTS = {"customer","product","department","region","status","segment","category"}

def _is_numeric(name: str) -> bool:
    n = (name or "").strip().lower()
    return any(h in n for h in NUMERIC_HINTS)

def _is_date(name: str) -> bool:
    n = (name or "").strip().lower()
    return any(h in n for h in DATE_HINTS)

def _is_category(name: str) -> bool:
    n = (name or "").strip().lower()
    return any(h in n for h in CATEGORICAL_HINTS)

def suggest_charts(columns: List[str]) -> Dict[str, Any]:
    cols = [str(c) for c in (columns or [])]
    # Determine likely roles
    date_cols = [c for c in cols if _is_date(c)]
    num_cols  = [c for c in cols if _is_numeric(c)]
    cat_cols  = [c for c in cols if _is_category(c) or c not in num_cols+date_cols]

    suggestions = []

    # Time series
    if date_cols and num_cols:
        suggestions.append({
            "chart_type": "line",
            "x_axis": date_cols[0],
            "y_axis": num_cols[0],
            "reasoning": "Detected date and numeric columns for time trend.",
        })

    # Category bar
    if cat_cols and num_cols:
        suggestions.append({
            "chart_type": "bar",
            "x_axis": cat_cols[0],
            "y_axis": num_cols[0],
            "reasoning": "Detected categorical and numeric columns for comparison.",
        })

    # Distribution
    if num_cols:
        suggestions.append({
            "chart_type": "histogram",
            "x_axis": num_cols[0],
            "reasoning": "Numeric column suitable for distribution analysis.",
        })

    # Pie for small categories
    if cat_cols:
        suggestions.append({
            "chart_type": "pie",
            "dimension": cat_cols[0],
            "reasoning": "Categorical column suitable for share breakdown (limited categories recommended).",
        })

    # Fallback
    if not suggestions and cols:
        suggestions.append({
            "chart_type": "table",
            "columns": cols[:8],
            "reasoning": "No strong signal detected; defaulting to tabular view.",
        })

    return {"suggestions": suggestions}
