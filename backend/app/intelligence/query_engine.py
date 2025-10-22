
from typing import Any, Dict, List
import pandas as pd

def _apply_filters(df: pd.DataFrame, filters: List[Dict[str, Any]]) -> pd.DataFrame:
    out = df.copy()
    for f in filters or []:
        col, op, val = f.get("column"), f.get("op"), f.get("value")
        if col not in out.columns:
            continue
        s = out[col]
        try:
            if op == "==":
                out = out[s == val]
            elif op == "!=":
                out = out[s != val]
            elif op == ">":
                out = out[s.astype(float) > float(val)]
            elif op == "<":
                out = out[s.astype(float) < float(val)]
            elif op == ">=":
                out = out[s.astype(float) >= float(val)]
            elif op == "<=":
                out = out[s.astype(float) <= float(val)]
            elif op == "contains":
                out = out[s.astype(str).str.contains(str(val), case=False, na=False)]
            elif op == "in":
                vs = val if isinstance(val, list) else [val]
                out = out[s.isin(vs)]
            elif op == "between":
                lo, hi = val if isinstance(val, (list, tuple)) and len(val) == 2 else (None, None)
                if lo is not None and hi is not None:
                    out = out[s.astype(float).between(float(lo), float(hi), inclusive="both")]
        except Exception:
            # Ignore bad casts
            pass
    return out

def _numeric_cols(df: pd.DataFrame):
    return df.select_dtypes(include=["number"]).columns.tolist()

def run_query(df: pd.DataFrame, query: Dict[str, Any]) -> Dict[str, Any]:
    # Apply filters
    dfq = _apply_filters(df, query.get("filters", []))
    metric = query.get("metric")
    group_by = query.get("groupBy")
    split_by = query.get("splitBy")
    agg = (query.get("agg") or "sum").lower()
    limit = int(query.get("limit") or 5000)

    # If no explicit metric, try to infer first numeric
    if not metric:
        nums = _numeric_cols(dfq)
        metric = nums[0] if nums else None

    # Basic aggregation
    if group_by and split_by and metric:
        grouped = (
            dfq.groupby([group_by, split_by])[metric]
            .agg(agg if agg != "avg" else "mean")
            .reset_index()
            .pivot(index=group_by, columns=split_by, values=metric)
            .fillna(0)
        )
        data = grouped.reset_index().to_dict(orient="records")
        rec_chart = "grouped_bar"
    elif group_by and metric:
        grouped = dfq.groupby(group_by)[metric].agg(agg if agg != "avg" else "mean").reset_index()
        data = grouped.sort_values(metric, ascending=False).head(limit).to_dict(orient="records")
        rec_chart = "bar"
    elif metric:
        val = float(dfq[metric].agg(agg if agg != "avg" else "mean")) if metric in dfq.columns else None
        data = [{metric: val}]
        rec_chart = "kpi"
    else:
        data = dfq.head(100).to_dict(orient="records")
        rec_chart = "table"

    cols = list(dfq.columns)
    return {
        "data": data,
        "columns": cols,
        "recommended_chart": rec_chart,
        "rows_after_filter": int(len(dfq)),
    }
