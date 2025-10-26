from typing import Any, Dict, List

import pandas as pd


def explore_query(rows: List[Dict[str, Any]], metric: str, by: str | None = None) -> Dict[str, Any]:
    if not rows:
        return {"series": [], "categories": [], "ok": True}
    df = pd.DataFrame(rows)
    if metric not in df.columns:
        return {"series": [], "categories": [], "ok": True, "message": "Metric not found"}
    if by and by in df.columns:
        grouped = df.groupby(by)[metric].sum().reset_index()
        return {
            "series": grouped[metric].tolist(),
            "categories": grouped[by].astype(str).tolist(),
            "ok": True,
        }
    # no dimension → overall sum
    return {"series": [df[metric].sum()], "categories": ["Total"], "ok": True}


def correlate(rows: List[Dict[str, Any]], target: str) -> Dict[str, Any]:
    if not rows:
        return {"ok": True, "correlations": []}
    df = pd.DataFrame(rows)
    if target not in df.columns:
        return {"ok": True, "correlations": [], "message": "Target not found"}
    num_df = df.select_dtypes(include="number")
    if target not in num_df.columns or len(num_df.columns) < 2:
        return {"ok": True, "correlations": []}
    corr = (
        num_df.corr(numeric_only=True)[target]
        .drop(labels=[target])
        .dropna()
        .sort_values(ascending=False)
    )
    out = [{"feature": k, "r": float(v)} for k, v in corr.items()]
    return {"ok": True, "correlations": out}
