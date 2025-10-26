from typing import Any, Dict, Optional

import numpy as np
import pandas as pd


def _infer_type(series: pd.Series) -> str:
    if pd.api.types.is_numeric_dtype(series):
        return "numeric"
    if pd.api.types.is_datetime64_any_dtype(series):
        return "temporal"
    if pd.api.types.is_bool_dtype(series):
        return "boolean"
    # Try parse dates lightly
    try:
        pd.to_datetime(series.dropna().head(20))
        return "temporal"
    except Exception:
        pass
    return "categorical"


def summarize_schema(df: pd.DataFrame) -> Dict[str, Any]:
    schema = []
    for c in df.columns:
        s = df[c]
        t = _infer_type(s)
        entry = {
            "name": c,
            "type": t,
            "non_null": int(s.notna().sum()),
            "missing": int(s.isna().sum()),
        }
        if t == "numeric":
            entry["min"] = (
                float(pd.to_numeric(s, errors="coerce").min(skipna=True)) if len(s) else None
            )
            entry["max"] = (
                float(pd.to_numeric(s, errors="coerce").max(skipna=True)) if len(s) else None
            )
        elif t in ("categorical", "boolean"):
            entry["unique"] = int(s.nunique(dropna=True))
        schema.append(entry)
    return {
        "rows": int(len(df)),
        "columns": int(len(df.columns)),
        "schema": schema,
    }


def quality_report(df: pd.DataFrame) -> Dict[str, Any]:
    # Duplicates
    dup_mask = df.duplicated(keep=False)
    duplicates = df[dup_mask]
    # Missing
    missing = df.isna().sum().to_dict()
    # Outliers (z-score > 3 for numeric)
    outliers = {}
    for col in df.select_dtypes(include=["number"]).columns:
        s = df[col].astype(float)
        m, sd = s.mean(), s.std(ddof=0)
        if sd == 0 or np.isnan(sd):
            continue
        z = (s - m) / sd
        idxs = z[np.abs(z) > 3].index.tolist()
        if idxs:
            outliers[col] = [
                {"row": int(i), "value": float(df.loc[i, col]), "z": float(z.loc[i])}
                for i in idxs[:100]
            ]
    return {
        "duplicates": {
            "count": int(len(duplicates)),
            "rows": duplicates.head(50).to_dict(orient="records"),
        },
        "missing": missing,
        "outliers": outliers,
    }


def correlations_for(
    df: pd.DataFrame, target: Optional[str] = None, threshold: float = 0.5
) -> Dict[str, Any]:
    num_df = df.select_dtypes(include=["number"]).copy()
    if num_df.empty:
        return {"correlations": []}
    corr = num_df.corr(numeric_only=True)
    out = []
    if target and target in corr.columns:
        series = corr[target].drop(labels=[target], errors="ignore")
        for col, r in series.items():
            if pd.notna(r) and abs(r) >= threshold:
                out.append({"column": col, "r": float(r)})
    else:
        # top pairs
        pairs = []
        cols = corr.columns.tolist()
        for i in range(len(cols)):
            for j in range(i + 1, len(cols)):
                r = corr.iloc[i, j]
                if pd.notna(r) and abs(r) >= threshold:
                    pairs.append({"a": cols[i], "b": cols[j], "r": float(r)})
        out = sorted(pairs, key=lambda x: -abs(x["r"]))[:25]
    return {"correlations": out}
