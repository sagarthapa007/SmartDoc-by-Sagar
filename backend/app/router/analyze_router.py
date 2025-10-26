import traceback
from datetime import datetime
from typing import Any, Dict, List, Optional

import numpy as np
import pandas as pd
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(tags=["Analyze"])


# ======================================================
# 🧩 Request Model
# ======================================================
class AnalyzeRequest(BaseModel):
    upload_id: str
    scrutiny: Dict[str, Any]


# ======================================================
# 🧠 Helper Functions
# ======================================================


def _calculate_data_quality_score(df: pd.DataFrame) -> float:
    """Generate a composite score (0–100) reflecting completeness, uniqueness, and consistency."""
    if df.empty:
        return 0.0

    completeness = 1 - (df.isna().sum().sum() / (df.shape[0] * df.shape[1]))
    uniqueness = df.apply(lambda x: x.nunique() / len(x) if len(x) else 0).mean()

    type_consistency = np.mean(
        [len(set(type(v).__name__ for v in df[c].dropna().head(100))) == 1 for c in df.columns]
    )

    validity = np.mean(
        [
            not np.any(np.isinf(df[c].dropna())) if df[c].dtype.kind in "fi" else True
            for c in df.columns
        ]
    )

    score = 0.4 * completeness + 0.2 * uniqueness + 0.2 * type_consistency + 0.2 * validity
    return round(score * 100, 1)


def _detect_patterns(df: pd.DataFrame) -> List[str]:
    """Detect statistical and structural patterns."""
    patterns = []
    if df.empty:
        return patterns

    n_rows, n_cols = df.shape
    if n_rows < 100:
        patterns.append("Small dataset suitable for prototyping and quick insights.")
    elif n_rows < 10000:
        patterns.append("Medium-scale dataset ideal for exploratory analytics.")
    else:
        patterns.append("Large dataset suitable for predictive modeling.")

    num_cols = df.select_dtypes(include=[np.number]).columns
    cat_cols = df.select_dtypes(exclude=[np.number]).columns

    if len(num_cols) > len(cat_cols):
        patterns.append("Predominantly numeric dataset — ideal for statistical modeling.")
    elif len(cat_cols) > len(num_cols):
        patterns.append("Categorical-heavy dataset — best suited for segmentation and grouping.")

    if any("date" in c.lower() or "time" in c.lower() for c in df.columns):
        patterns.append("Temporal column detected — time series analysis possible.")

    return patterns


def _generate_summary(df: pd.DataFrame, scrutiny: Dict[str, Any]) -> str:
    """Generate executive summary of the dataset."""
    if df.empty:
        return f"No tabular data extracted from {scrutiny.get('file_type', 'file')}."

    n_rows, n_cols = df.shape
    numeric_cols = len(df.select_dtypes(include=[np.number]).columns)
    categorical_cols = len(df.select_dtypes(exclude=[np.number]).columns)
    quality_score = _calculate_data_quality_score(df)

    summary = (
        f"This dataset contains **{n_rows:,} records** across **{n_cols} columns** — "
        f"{numeric_cols} numeric and {categorical_cols} categorical. "
        f"Data quality score: **{quality_score}/100**. "
    )

    if quality_score >= 85:
        summary += "Overall data quality is excellent. "
    elif quality_score >= 65:
        summary += "Data quality is acceptable, with minor issues. "
    else:
        summary += "Data quality requires improvement. "

    patterns = _detect_patterns(df)
    if patterns:
        summary += "Key characteristics: " + "; ".join(patterns)

    return summary


def _generate_insights(df: pd.DataFrame) -> List[str]:
    """Generate simple AI-style observations."""
    insights = []
    if df.empty:
        return ["No data available for insight generation."]

    num_cols = df.select_dtypes(include=[np.number])
    cat_cols = df.select_dtypes(exclude=[np.number])

    if not num_cols.empty:
        for c in num_cols.columns[:2]:
            mean_val = num_cols[c].mean()
            std_val = num_cols[c].std()
            if std_val > 0:
                cv = std_val / mean_val if mean_val != 0 else 0
                if cv > 1:
                    insights.append(
                        f"🔹 {c}: highly variable (CV={cv:.2f}) — potential outliers exist."
                    )
                elif cv < 0.2:
                    insights.append(f"🔹 {c}: low variability — mostly uniform data.")

    if not cat_cols.empty:
        for c in cat_cols.columns[:2]:
            dominant = cat_cols[c].value_counts(normalize=True).head(1)
            if not dominant.empty and dominant.iloc[0] > 0.6:
                insights.append(
                    f"🏷️ {c}: dominated by one category ({dominant.index[0]}) — imbalance detected."
                )
            else:
                insights.append(f"🏷️ {c}: diverse category distribution detected.")

    if len(insights) < 2:
        insights.append("📈 No significant anomalies detected in data distribution.")

    return insights


def _generate_recommendations(df: pd.DataFrame) -> List[str]:
    """Suggest next-step actions."""
    recs = []
    if df.empty:
        return ["Upload a structured file for meaningful recommendations."]

    if df.shape[0] > 10000:
        recs.append("Consider downsampling or batch processing for performance optimization.")
    if df.shape[1] > 25:
        recs.append("Apply dimensionality reduction or correlation filtering to simplify analysis.")
    if df.isna().sum().sum() > 0:
        recs.append("Handle missing values via imputation or removal before model training.")

    recs.append("Proceed with visualization and insight generation.")
    return recs


def _generate_charts(df: pd.DataFrame) -> List[Dict[str, Any]]:
    """Generate preview chart data for frontend visualization."""
    charts = []
    if df.empty:
        return charts

    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    categorical_cols = df.select_dtypes(include=["object"]).columns.tolist()

    # Bar Chart for categorical variable
    for c in categorical_cols[:1]:
        counts = df[c].value_counts().head(8)
        charts.append(
            {
                "type": "bar",
                "title": f"Top Categories in {c}",
                "labels": counts.index.tolist(),
                "values": counts.values.tolist(),
                "color": "#3b82f6",
            }
        )

    # Histogram for numeric variable
    for c in numeric_cols[:1]:
        hist = np.histogram(df[c].dropna(), bins=10)
        charts.append(
            {
                "type": "bar",
                "title": f"Distribution of {c}",
                "labels": [str(round(v, 2)) for v in hist[1][:-1]],
                "values": hist[0].tolist(),
                "color": "#10b981",
            }
        )

    return charts


# ======================================================
# 🚀 Main Route
# ======================================================


@router.post("/analyze", response_model=Dict[str, Any])
async def analyze(request: AnalyzeRequest):
    start_time = datetime.utcnow()
    try:
        scrutiny = request.scrutiny or {}
        preview = scrutiny.get("preview", [])
        headers = scrutiny.get("headers", [])
        schema = scrutiny.get("schema", [])
        file_type = scrutiny.get("file_type", "unknown")

        df = pd.DataFrame(preview)
        if not df.empty and len(headers) == len(df.columns):
            df.columns = headers

        quality_score = _calculate_data_quality_score(df)

        response = {
            "upload_id": request.upload_id,
            "summary": _generate_summary(df, scrutiny),
            "insights": _generate_insights(df),
            "recommendations": _generate_recommendations(df),
            "charts": _generate_charts(df),
            "metadata": {
                "file_type": file_type,
                "rows": int(df.shape[0]),
                "cols": int(df.shape[1]),
                "data_quality_score": quality_score,
                "analysis_version": "6.3",
                "analyzed_at": start_time.isoformat(),
                "processing_ms": round((datetime.utcnow() - start_time).total_seconds() * 1000, 2),
            },
            "status": "success",
        }
        return response

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(
            status_code=500, detail={"status": "error", "message": f"Analysis failed: {str(e)}"}
        )
