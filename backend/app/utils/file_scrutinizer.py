import os
import io
import math
import json
import warnings
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime

import pandas as pd

# Optional libs for documents (guarded imports)
try:
    from docx import Document as DocxDocument  # DOCX
except Exception:
    DocxDocument = None

try:
    # Basic .doc support is limited; python-docx doesn't read .doc.
    # If you install 'textract' or 'mammoth', you can enhance this branch.
    import textract  # optional
except Exception:
    textract = None

try:
    from PyPDF2 import PdfReader  # PDF
except Exception:
    PdfReader = None


# =========================
# Helpers
# =========================

def _summarize_text(text: str, limit: int = 1000) -> str:
    text = (text or "").replace("\r", " ").replace("\n", " ").strip()
    return text[:limit] + ("..." if len(text) > limit else "")


def _safe_to_datetime_share(s: pd.Series) -> float:
    """Share of values that parse as datetime; silence pandas warnings."""
    with warnings.catch_warnings():
        warnings.simplefilter("ignore", category=UserWarning)
        parsed = pd.to_datetime(s, errors="coerce", infer_datetime_format=False)
    return parsed.notna().mean() if len(s) else 0.0


def _infer_col_type(s: pd.Series) -> str:
    """Infer coarse type: number | integer | string | boolean | datetime | categorical."""
    ss = s.astype("string")

    # boolean-ish
    if ss.dropna().isin(["true", "false", "True", "False", "0", "1", "yes", "no"]).mean() > 0.9:
        return "boolean"

    # numeric / integer
    numeric_share = pd.to_numeric(ss, errors="coerce").notna().mean() if len(ss) else 0.0
    if numeric_share > 0.9:
        coerced = pd.to_numeric(ss, errors="coerce")
        if coerced.dropna().apply(lambda x: float(x).is_integer()).mean() > 0.9:
            return "integer"
        return "number"

    # datetime
    if _safe_to_datetime_share(ss) > 0.7:
        return "datetime"

    # categorical (few unique)
    nunique = ss.nunique(dropna=True)
    if len(ss) > 0 and nunique > 0 and (nunique / len(ss)) < 0.1:
        return "categorical"

    return "string"


def _schema_from_df(df: pd.DataFrame) -> List[Dict[str, Any]]:
    cols = []
    for c in df.columns:
        s = df[c]
        inferred = _infer_col_type(s)
        cols.append({
            "name": str(c),
            "type": inferred,
            "sample_values": s.head(3).astype("string").tolist()
        })
    return cols


def _quality_scan(df: pd.DataFrame) -> Dict[str, Any]:
    missing = df.isna().sum().to_dict()
    missing_pct = {k: (float(v) / len(df) if len(df) else 0.0) for k, v in missing.items()}

    numeric_cols = [c for c in df.columns if pd.api.types.is_numeric_dtype(df[c])]
    zeros, negatives = {}, {}
    for c in numeric_cols:
        col = pd.to_numeric(df[c], errors="coerce")
        zeros[c] = int((col == 0).sum())
        negatives[c] = int((col < 0).sum())

    return {
        "missing": missing,
        "missing_pct": missing_pct,
        "numeric_zeros": zeros,
        "numeric_negatives": negatives
    }


def _df_preview(df: pd.DataFrame, limit: int = 20) -> List[Dict[str, Any]]:
    return df.head(limit).to_dict(orient="records")


def _structured_result(
    file_type: str,
    original_name: str,
    size_bytes: int,
    message: str,
    df: Optional[pd.DataFrame] = None,
    extras: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    out = {
        "file_type": file_type,
        "original_name": original_name,
        "size_bytes": size_bytes,
        "upload_time": datetime.utcnow().isoformat() + "Z",
        "message": message,
        "headers": [],
        "rows_detected": 0,
        "columns_detected": 0,
        "schema": [],
        "quality": {},
        "preview": [],
        "confidence": 0.0,
        "suggestions": [],
    }
    if df is not None and not df.empty:
        df = df.reset_index(drop=True)
        out["headers"] = list(map(str, df.columns))
        out["rows_detected"] = int(len(df))
        out["columns_detected"] = int(df.shape[1])
        out["schema"] = _schema_from_df(df)
        out["quality"] = _quality_scan(df)
        out["preview"] = _df_preview(df)

        # confidence heuristic: more rows/cols -> more “tabular” confidence
        base = min(1.0, math.log10(max(10, len(df))) / 3.0 + (len(df.columns) / 50.0))
        out["confidence"] = round(min(1.0, base), 3)

        # suggestions
        sug = []
        if any(v > 0 for v in out["quality"]["numeric_negatives"].values()):
            sug.append("Review negative values in numeric columns.")
        if any(pct > 0.2 for pct in out["quality"]["missing_pct"].values()):
            sug.append("Consider imputing or removing columns with >20% missing.")
        if out["columns_detected"] > 30:
            sug.append("High-dimensional data: consider feature selection/PCA.")
        out["suggestions"] = sug or ["Looks good — proceed to analysis."]
    if extras:
        out.update(extras)
    return out


# =========================
# Readers (datasets)
# =========================

def _read_csv(path: str) -> pd.DataFrame:
    # permissive engine for odd CSVs + encodings
    with warnings.catch_warnings():
        warnings.simplefilter("ignore", category=UserWarning)
        return pd.read_csv(path, engine="python", on_bad_lines="skip")


def _read_excel(path: str) -> pd.DataFrame:
    with warnings.catch_warnings():
        warnings.simplefilter("ignore", category=UserWarning)
        return pd.read_excel(path)


def _read_json(path: str) -> pd.DataFrame:
    try:
        return pd.read_json(path)  # array/records
    except Exception:
        return pd.read_json(path, lines=True)  # JSON lines


# =========================
# Readers (documents)
# =========================

def _docx_text(path: str, max_chars: int = 8000) -> Tuple[str, int]:
    if DocxDocument is None:
        return ("DOCX detected. Install `python-docx` for parsing.", 0)
    try:
        doc = DocxDocument(path)
        parts = []
        # paragraphs
        for p in doc.paragraphs:
            t = (p.text or "").strip()
            if t:
                parts.append(t)
            if sum(len(x) for x in parts) > max_chars:
                break
        # a tiny taste of table text
        for tbl in getattr(doc, "tables", [])[:2]:
            for row in tbl.rows[:2]:
                cells = [c.text.strip() for c in row.cells]
                row_txt = " | ".join(cells).strip()
                if row_txt:
                    parts.append(f"[TABLE ROW] {row_txt}")
            if sum(len(x) for x in parts) > max_chars:
                break
        text = "\n".join(parts)
        return text, len(text)
    except Exception as e:
        return (f"DOCX parsing error: {e}", 0)


def _doc_text(path: str, max_chars: int = 8000) -> Tuple[str, int]:
    # Legacy .doc support: try textract if available
    if textract is None:
        return ("DOC detected. Install `textract` for legacy .doc parsing.", 0)
    try:
        raw = textract.process(path)
        text = (raw.decode("utf-8", errors="ignore") if isinstance(raw, (bytes, bytearray)) else str(raw))
        text = " ".join(text.split())
        text = text[:max_chars]
        return text, len(text)
    except Exception as e:
        return (f"DOC parsing error: {e}", 0)


def _pdf_text(path: str, max_chars: int = 20000) -> Tuple[str, int]:
    if PdfReader is None:
        return ("PDF detected. Install `PyPDF2` for parsing.", 0)
    try:
        reader = PdfReader(path)
        texts = []
        for page in reader.pages:
            t = page.extract_text() or ""
            if t:
                texts.append(t)
            if sum(len(x) for x in texts) > max_chars:
                break
        text = " ".join(" ".join(texts).split())
        text = text[:max_chars]
        return text, len(text)
    except Exception as e:
        return (f"PDF parsing error: {e}", 0)


# =========================
# Public API
# =========================

def scrutinize_file(file_path: str, original_name: str) -> Dict[str, Any]:
    """
    Universal scrutinizer used by the upload route.
    - file_path: local temp path where the uploaded file is stored
    - original_name: original filename (for display)
    Returns a rich dict for UI preview + downstream analysis.
    """
    ext = os.path.splitext(original_name)[1].lower().lstrip(".")
    size_bytes = os.path.getsize(file_path) if os.path.exists(file_path) else 0

    # ---------- Structured (tabular) ----------
    if ext in ("csv",):
        try:
            df = _read_csv(file_path)
            return _structured_result(
                file_type="csv",
                original_name=original_name,
                size_bytes=size_bytes,
                message=f"CSV detected: {len(df)} rows × {df.shape[1]} columns.",
                df=df
            )
        except Exception as e:
            return _structured_result("csv", original_name, size_bytes, f"CSV read error: {e}")

    if ext in ("xlsx", "xls"):
        try:
            df = _read_excel(file_path)
            return _structured_result(
                file_type="excel",
                original_name=original_name,
                size_bytes=size_bytes,
                message=f"Excel detected: {len(df)} rows × {df.shape[1]} columns.",
                df=df
            )
        except Exception as e:
            return _structured_result("excel", original_name, size_bytes, f"Excel read error: {e}")

    if ext in ("json",):
        try:
            df = _read_json(file_path)
            if isinstance(df, pd.DataFrame) and not df.empty:
                return _structured_result(
                    file_type="json",
                    original_name=original_name,
                    size_bytes=size_bytes,
                    message=f"JSON dataset detected: {len(df)} rows × {df.shape[1]} columns.",
                    df=df
                )
            else:
                # Non-tabular JSON: return excerpt
                with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                    raw = f.read(1200)
                return _structured_result(
                    file_type="json",
                    original_name=original_name,
                    size_bytes=size_bytes,
                    message="JSON detected (non-tabular).",
                    df=None,
                    extras={
                        "preview": [{"raw_excerpt": raw}],
                        "confidence": 0.5,
                        "suggestions": ["Consider row-oriented JSON (array of records) for richer analysis."]
                    }
                )
        except Exception as e:
            return _structured_result("json", original_name, size_bytes, f"JSON read error: {e}")

    # ---------- Unstructured (documents/text) ----------
    if ext in ("docx",):
        text, n = _docx_text(file_path)
        return _structured_result(
            file_type="docx",
            original_name=original_name,
            size_bytes=size_bytes,
            message="DOCX detected — extracted summary." if n else text,
            df=None,
            extras={
                "summary_excerpt": _summarize_text(text, 1200),
                "extracted_chars": n,
                "confidence": 0.6 if n else 0.4,
                "suggestions": [
                    "For table-heavy DOCX, consider exporting tables to CSV/XLSX for deeper analysis.",
                    "Use the Intelligence module to generate an AI executive summary."
                ]
            }
        )

    if ext in ("doc",):
        text, n = _doc_text(file_path)
        return _structured_result(
            file_type="doc",
            original_name=original_name,
            size_bytes=size_bytes,
            message="DOC detected — extracted summary." if n else text,
            df=None,
            extras={
                "summary_excerpt": _summarize_text(text, 1200),
                "extracted_chars": n,
                "confidence": 0.55 if n else 0.35,
                "suggestions": [
                    "Legacy .doc format detected. Converting to DOCX may improve parsing quality.",
                    "Export tables to CSV/XLSX for structured analysis."
                ]
            }
        )

    if ext in ("pdf",):
        text, n = _pdf_text(file_path)
        return _structured_result(
            file_type="pdf",
            original_name=original_name,
            size_bytes=size_bytes,
            message="PDF detected — extracted summary." if n else text,
            df=None,
            extras={
                "summary_excerpt": _summarize_text(text, 1200),
                "extracted_chars": n,
                "confidence": 0.55 if n else 0.4,
                "suggestions": [
                    "For table-heavy PDFs, upload the source CSV/XLSX for best results.",
                    "Use the Intelligence module to generate an AI executive summary."
                ]
            }
        )

    if ext in ("txt",):
        try:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                text = f.read(16000)
            return _structured_result(
                file_type="txt",
                original_name=original_name,
                size_bytes=size_bytes,
                message="Plain text detected.",
                df=None,
                extras={
                    "summary_excerpt": _summarize_text(text, 1200),
                    "extracted_chars": len(text),
                    "confidence": 0.6,
                    "suggestions": [
                        "If this represents structured data, consider CSV for deeper analysis."
                    ]
                }
            )
        except Exception as e:
            return _structured_result("txt", original_name, size_bytes, f"TXT read error: {e}")

    # ---------- Fallback ----------
    return _structured_result(
        file_type=ext or "unknown",
        original_name=original_name,
        size_bytes=size_bytes,
        message=f"Unsupported or unknown file type: {ext or 'unknown'}",
        df=None,
        extras={
            "confidence": 0.2,
            "suggestions": ["Try CSV, XLSX, or JSON for structured analysis."]
        }
    )
