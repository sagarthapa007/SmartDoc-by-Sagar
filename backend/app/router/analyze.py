import math
from datetime import datetime
from typing import Any, Dict, List, Optional

import numpy as np
import pandas as pd
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(tags=["Analyze"])

# ============================================================
# ⚙️ Version Constant
# ============================================================
ENGINE_VERSION = "7.0.1"


# ============================================================
# 🧠 Data Models
# ============================================================
class AnalyzeRequest(BaseModel):
    upload_id: str
    scrutiny: Dict[str, Any]


# ============================================================
# 🧩 Helpers
# ============================================================
def _sanitize_for_json(obj):
    """Recursively replace NaN/Inf with None for JSON serialization."""
    if isinstance(obj, dict):
        return {k: _sanitize_for_json(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [_sanitize_for_json(v) for v in obj]
    elif isinstance(obj, float):
        if math.isnan(obj) or math.isinf(obj):
            return None
    return obj


def _calculate_data_quality_score(df: pd.DataFrame) -> float:
    """Compute weighted data quality score (0–100)."""
    if df.empty:
        return 0.0

    metrics = []
    completeness = 1 - (df.isna().sum().sum() / (df.shape[0] * df.shape[1]))
    metrics.append(completeness * 40)  # 40% weight

    uniqueness = df.apply(lambda x: x.nunique() / len(x)).mean()
    metrics.append(uniqueness * 20)  # 20% weight

    type_score = 0
    for col in df.columns:
        if df[col].dtype == "object":
            vals = df[col].dropna().head(100)
            if len(vals):
                consistent = len(set(type(v).__name__ for v in vals)) == 1
                type_score += 1 if consistent else 0.5
        else:
            type_score += 1
    type_score = (type_score / len(df.columns)) * 20
    metrics.append(type_score)

    validity_score = 0
    for col in df.columns:
        if df[col].dtype in ["int64", "float64"]:
            if not np.isinf(df[col].dropna()).any():
                validity_score += 1
        else:
            validity_score += 1
    validity_score = (validity_score / len(df.columns)) * 20
    metrics.append(validity_score)

    return round(min(100, sum(metrics)), 1)


def _detect_dataset_patterns(df: pd.DataFrame) -> List[str]:
    """Detect dataset size and correlation patterns."""
    patterns = []
    if df.empty:
        return patterns

    n_rows, n_cols = df.shape
    if n_rows > 10000:
        patterns.append("Large-scale dataset suitable for big data analytics")
    elif n_rows > 1000:
        patterns.append("Medium-sized dataset ideal for statistical analysis")
    else:
        patterns.append("Small dataset suitable for rapid prototyping")

    num_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    cat_cols = df.select_dtypes(include=["object"]).columns.tolist()
    date_cols = [
        c
        for c in df.columns
        if any(k in c.lower() for k in ["date", "time", "year", "month", "day"])
    ]

    if len(num_cols) > len(cat_cols):
        patterns.append("Numeric-dominated dataset suitable for statistical modeling")
    elif len(cat_cols) > len(num_cols):
        patterns.append("Categorical-dominated dataset ideal for classification analysis")
    if date_cols:
        patterns.append("Time-series features detected – temporal trends available")

    if len(num_cols) >= 2:
        corr = df[num_cols].corr()
        high_corr = [
            (corr.columns[i], corr.columns[j])
            for i in range(len(corr.columns))
            for j in range(i + 1, len(corr.columns))
            if abs(corr.iloc[i, j]) > 0.7
        ]
        if high_corr:
            patterns.append(f"Strong correlations found among {len(high_corr)} variable pairs")

    return patterns


def _generate_enhanced_summary(df: pd.DataFrame, upload_id: str, scrutiny: Dict[str, Any]) -> str:
    """Generate descriptive, natural-language summary."""
    if df.empty:
        ft = scrutiny.get("file_type", "unknown").upper()
        return f"Uploaded {ft} file requires text-based processing. Use the Intelligence module for document insights."

    n_rows, n_cols = df.shape
    num_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    cat_cols = df.select_dtypes(include=["object"]).columns.tolist()
    date_cols = [c for c in df.columns if any(k in c.lower() for k in ["date", "time"])]

    missing_pct = (df.isnull().sum().sum() / (n_rows * n_cols)) * 100 if n_rows * n_cols else 0
    summary = [
        f"This dataset has {n_rows:,} records and {n_cols} columns: "
        f"{len(num_cols)} numeric, {len(cat_cols)} categorical, and {len(date_cols)} date/time fields. "
    ]
    summary.append(
        "Data appears complete with minimal missing values. "
        if missing_pct < 10
        else f"Approximately {missing_pct:.1f}% of values are missing. "
    )

    patterns = _detect_dataset_patterns(df)
    if patterns:
        summary.append(f"Key characteristics: {patterns[0].lower()}.")

    return "".join(summary)


def _generate_advanced_charts(df: pd.DataFrame) -> List[Dict[str, Any]]:
    """Generate bar/pie/line/correlation/outlier visualizations."""
    charts = []
    if df.empty:
        return charts

    try:
        num_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        cat_cols = df.select_dtypes(include=["object"]).columns.tolist()
        date_cols = [
            c
            for c in df.columns
            if any(k in c.lower() for k in ["date", "time", "year", "month", "day"])
        ]

        # Stop if no numeric columns
        if not num_cols and not cat_cols:
            return charts

        # Distribution of numeric
        for col in num_cols[:2]:
            if df[col].nunique() > 1:
                hist = pd.cut(df[col], bins=min(10, df[col].nunique()))
                counts = hist.value_counts().sort_index()
                charts.append(
                    {
                        "type": "bar",
                        "title": f"Distribution of {col}",
                        "labels": [str(x) for x in counts.index],
                        "values": counts.values.tolist(),
                        "color": "#3b82f6",
                    }
                )

        # Pie for categorical
        for col in cat_cols[:2]:
            if df[col].nunique() <= 15:
                counts = df[col].value_counts().head(10)
                charts.append(
                    {
                        "type": "pie",
                        "title": f"Composition of {col}",
                        "labels": counts.index.astype(str).tolist(),
                        "values": counts.values.tolist(),
                    }
                )

        # Correlation heatmap summary
        if len(num_cols) >= 3:
            corr = df[num_cols[:5]].corr()
            pairs = []
            for i in range(len(corr.columns)):
                for j in range(i + 1, len(corr.columns)):
                    pairs.append(
                        {
                            "pair": f"{corr.columns[i]} vs {corr.columns[j]}",
                            "corr": round(corr.iloc[i, j], 3),
                        }
                    )
            pairs = sorted(pairs, key=lambda x: abs(x["corr"]), reverse=True)[:8]
            if pairs:
                charts.append(
                    {
                        "type": "bar",
                        "title": "Top Variable Correlations",
                        "labels": [p["pair"] for p in pairs],
                        "values": [p["corr"] for p in pairs],
                        "color": "#10b981",
                    }
                )

        # Time-series
        for dc in date_cols[:1]:
            if len(num_cols) > 0:
                try:
                    df_t = df.copy()
                    df_t[dc] = pd.to_datetime(df_t[dc], errors="coerce")
                    df_t.dropna(subset=[dc], inplace=True)
                    df_t["month"] = df_t[dc].dt.to_period("M")
                    avg = df_t.groupby("month")[num_cols[0]].mean().reset_index()
                    avg["month"] = avg["month"].astype(str)
                    charts.append(
                        {
                            "type": "line",
                            "title": f"Monthly Trend of {num_cols[0]}",
                            "labels": avg["month"].tolist(),
                            "values": avg[num_cols[0]].round(2).tolist(),
                            "color": "#8b5cf6",
                        }
                    )
                except Exception:
                    pass

        # Missing values
        missing = df.isna().sum()
        missing = missing[missing > 0].sort_values(ascending=False).head(8)
        if not missing.empty:
            charts.append(
                {
                    "type": "bar",
                    "title": "Missing Values by Column",
                    "labels": missing.index.tolist(),
                    "values": missing.values.tolist(),
                    "color": "#ef4444",
                }
            )

        # Outlier detection
        for col in num_cols[:1]:
            if df[col].nunique() > 10:
                Q1, Q3 = df[col].quantile([0.25, 0.75])
                IQR = Q3 - Q1
                lower, upper = Q1 - 1.5 * IQR, Q3 + 1.5 * IQR
                outliers = df[(df[col] < lower) | (df[col] > upper)]
                if len(outliers) > 0:
                    charts.append(
                        {
                            "type": "bar",
                            "title": f"Outlier Analysis - {col}",
                            "labels": ["Normal", "Outliers"],
                            "values": [len(df) - len(outliers), len(outliers)],
                            "color": "#f59e0b",
                        }
                    )

    except Exception as e:
        charts.append(
            {
                "type": "info",
                "title": "Chart Generation Error",
                "labels": ["error"],
                "values": [str(e)],
            }
        )
    return charts


def _generate_comprehensive_insights(df: pd.DataFrame, scrutiny: Dict[str, Any]) -> List[str]:
    """Generate human-readable statistical insights."""
    insights = []
    if df.empty:
        ft = scrutiny.get("file_type", "unknown")
        return [
            f"No structured data detected for {ft.upper()} file. Use Intelligence module for text insights."
        ]

    try:
        n_rows, n_cols = df.shape
        num_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        cat_cols = df.select_dtypes(include=["object"]).columns.tolist()

        insights.append(
            f"Dataset contains {n_rows:,} records and {n_cols} fields ({len(num_cols)} numeric, {len(cat_cols)} categorical)."
        )

        miss = (df.isna().sum().sum() / (n_rows * n_cols)) * 100
        if miss > 20:
            insights.append(f"⚠️ High missing rate: {miss:.1f}%")
        elif miss > 5:
            insights.append(f"ℹ️ Moderate missing rate: {miss:.1f}%")
        else:
            insights.append("✅ Excellent data completeness.")

        for col in num_cols[:3]:
            mean, std = df[col].mean(), df[col].std()
            if mean != 0:
                cv = std / mean
                if cv > 1:
                    insights.append(f"{col} has high variability (CV={cv:.2f}).")
                elif cv > 0.5:
                    insights.append(f"{col} shows moderate variability (CV={cv:.2f}).")
                else:
                    insights.append(f"{col} is stable (CV={cv:.2f}).")

        patterns = _detect_dataset_patterns(df)
        insights.extend([f"🔍 {p}" for p in patterns[:2]])

    except Exception as e:
        insights.append(f"Insight generation error: {e}")
    return insights


def _generate_strategic_recommendations(df: pd.DataFrame, scrutiny: Dict[str, Any]) -> List[str]:
    """Strategic and technical next-step recommendations."""
    recs = []
    if df.empty:
        ft = scrutiny.get("file_type", "unknown").upper()
        if ft in ["PDF", "DOCX", "DOC", "TXT"]:
            return [
                "Use the Intelligence module for text summarization and entity extraction.",
                "Generate executive summaries from document content.",
                "Apply sentiment or topic classification if applicable.",
            ]
        else:
            return ["Upload structured data (CSV, Excel, JSON) for analytics."]

    n_rows, n_cols = df.shape
    num_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    miss = df.isnull().sum()

    if (miss > 0).any():
        recs.append("Handle missing values using imputation or cleaning.")

    if n_rows > 10000:
        recs.append("Sample large datasets for performance optimization.")
    if n_cols > 20:
        recs.append("Apply feature selection or PCA for dimensionality reduction.")
    if len(num_cols) >= 2:
        recs.append("Perform correlation and multivariate analysis.")
    if n_rows > 100 and len(num_cols) >= 3:
        recs.append("Consider machine learning modeling (regression/classification).")

    recs.append("Build interactive dashboards and automate reporting.")
    recs.append("Validate data against business logic for consistency.")
    return recs[:8]


# ============================================================
# 🚀 Main Endpoint
# ============================================================
@router.post("/analyze")
async def analyze(request: AnalyzeRequest):
    start_time = datetime.now()
    try:
        scrutiny = request.scrutiny or {}
        preview = scrutiny.get("preview", [])
        file_type = scrutiny.get("file_type", "unknown")
        df = pd.DataFrame(preview) if isinstance(preview, list) and preview else pd.DataFrame()
        df.columns = [str(c).strip().replace(" ", "_") for c in df.columns]

        if df.empty:
            result = {
                "upload_id": request.upload_id,
                "summary": _generate_enhanced_summary(df, request.upload_id, scrutiny),
                "insights": _generate_comprehensive_insights(df, scrutiny),
                "recommendations": _generate_strategic_recommendations(df, scrutiny),
                "charts": [],
                "metadata": {
                    "analysis_version": ENGINE_VERSION,
                    "document_type": file_type,
                    "row_count": 0,
                    "col_count": 0,
                    "analysis_timestamp": datetime.utcnow().isoformat(),
                    "data_quality_score": 0,
                    "processing_time_ms": 0,
                },
                "status": "success",
                "analysis_type": "document",
            }
        else:
            quality = _calculate_data_quality_score(df)
            charts = _generate_advanced_charts(df)
            insights = _generate_comprehensive_insights(df, scrutiny)
            recs = _generate_strategic_recommendations(df, scrutiny)
            summary = _generate_enhanced_summary(df, request.upload_id, scrutiny)
            proc_time = (datetime.now() - start_time).total_seconds() * 1000

            result = {
                "upload_id": request.upload_id,
                "summary": summary,
                "insights": insights,
                "recommendations": recs,
                "charts": charts,
                "metadata": {
                    "analysis_version": ENGINE_VERSION,
                    "document_type": file_type,
                    "row_count": int(df.shape[0]),
                    "col_count": int(df.shape[1]),
                    "analysis_timestamp": datetime.utcnow().isoformat(),
                    "data_quality_score": quality,
                    "processing_time_ms": int(proc_time),
                },
                "status": "success",
                "analysis_type": "tabular",
            }

        print(
            f"✅ Analysis completed for {request.upload_id} — {df.shape[0]} rows × {df.shape[1]} cols ({file_type})"
        )
        return _sanitize_for_json(result)

    except Exception as e:
        import traceback

        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Analysis failed: {e}")
