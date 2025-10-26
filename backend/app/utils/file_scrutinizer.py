import math
import os
import warnings
from datetime import datetime
from io import StringIO
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
import pandas as pd

# Optional libs for documents
try:
    from docx import Document as DocxDocument
except Exception:
    DocxDocument = None

try:
    import textract
except Exception:
    textract = None

try:
    from PyPDF2 import PdfReader
except Exception:
    PdfReader = None


# ======================================================
# 🧠 Utility Helpers
# ======================================================


def _summarize_text(text: str, limit: int = 1000) -> str:
    text = (text or "").replace("\r", " ").replace("\n", " ").strip()
    return text[:limit] + ("..." if len(text) > limit else "")


def _safe_to_datetime_share(s: pd.Series) -> float:
    with warnings.catch_warnings():
        warnings.simplefilter("ignore", category=UserWarning)
        parsed = pd.to_datetime(s, errors="coerce")
    return parsed.notna().mean() if len(s) else 0.0


def _infer_col_type(s: pd.Series) -> str:
    """Infer column type efficiently and safely."""
    if s.dropna().empty:
        return "string"

    if pd.api.types.is_bool_dtype(s):
        return "boolean"
    if pd.api.types.is_integer_dtype(s):
        return "integer"
    if pd.api.types.is_float_dtype(s):
        return "number"

    ss = s.astype("string")

    if (
        ss.dropna().str.strip().str.lower().isin(["true", "false", "0", "1", "yes", "no"]).mean()
        > 0.9
    ):
        return "boolean"

    coerced = pd.to_numeric(ss, errors="coerce")
    numeric_share = coerced.notna().mean() if len(ss) else 0.0
    if numeric_share > 0.9:
        if coerced.dropna().apply(lambda x: float(x).is_integer()).mean() > 0.9:
            return "integer"
        return "number"

    if _safe_to_datetime_share(ss) > 0.7:
        return "datetime"

    nunique = ss.nunique(dropna=True)
    if len(ss) > 0 and nunique > 0 and (nunique / len(ss)) < 0.1:
        return "categorical"

    return "string"


def _schema_from_df(df: pd.DataFrame) -> List[Dict[str, Any]]:
    cols = []
    for c in df.columns:
        s = df[c]
        inferred = _infer_col_type(s)
        cols.append(
            {"name": str(c), "type": inferred, "sample_values": s.head(3).astype("string").tolist()}
        )
    return cols


def _quality_scan(df: pd.DataFrame) -> Dict[str, Any]:
    missing = df.isna().sum().to_dict()
    missing_pct = {k: (float(v) / len(df) if len(df) else 0.0) for k, v in missing.items()}

    numeric_cols = [c for c in df.columns if pd.api.types.is_numeric_dtype(df[c])]
    zeros = {c: int((df[c] == 0).sum()) for c in numeric_cols}
    negatives = {c: int((df[c] < 0).sum()) for c in numeric_cols}

    return {
        "missing": missing,
        "missing_pct": missing_pct,
        "numeric_zeros": zeros,
        "numeric_negatives": negatives,
    }


def _df_preview(df: pd.DataFrame, limit: int = 20) -> List[Dict[str, Any]]:
    return df.head(limit).to_dict(orient="records")


def _structured_result(
    file_type: str,
    original_name: str,
    size_bytes: int,
    message: str,
    df: Optional[pd.DataFrame] = None,
    extras: Optional[Dict[str, Any]] = None,
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

        base = min(1.0, (math.log10(max(10, len(df))) / 4.0) + (len(df.columns) / 60.0))
        out["confidence"] = round(min(1.0, base), 3)

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


# ======================================================
# 🧩 Smart Header Handling & Cleaning
# ======================================================


def _best_header_row_from_sample(sample_rows: List[List[str]]) -> int:
    if not sample_rows:
        return 0
    scores = []
    for i, row in enumerate(sample_rows):
        stripped = [str(c).strip() for c in row if str(c).strip()]
        if not stripped:
            scores.append((i, 0.0))
            continue
        avg_len = float(np.mean([len(c) for c in stripped]))
        score = len(stripped) + 0.5 * avg_len
        scores.append((i, score))
    return max(scores, key=lambda x: x[1])[0] if scores else 0


def _clean_and_dedupe_headers(columns) -> List[str]:
    cleaned, seen = [], {}
    for idx, c in enumerate(columns):
        name = str(c or "").replace("\n", " ").strip()
        name = " ".join(name.split())
        if not name or "unnamed" in name.lower():
            name = f"col_{idx+1}"
        base, k = name, 1
        while name.lower() in seen:
            k += 1
            name = f"{base}_{k}"
        seen[name.lower()] = True
        cleaned.append(name)
    return cleaned


def _drop_empty_edges(df: pd.DataFrame) -> pd.DataFrame:
    if df.empty:
        return df
    empty_mask = df.isna() | df.astype(str).map(lambda x: x.strip() == "")
    df = df.loc[:, ~empty_mask.all(axis=0)]
    df = df.loc[~empty_mask.all(axis=1)]
    return df


def _coerce_common_types(df: pd.DataFrame) -> pd.DataFrame:
    for c in df.columns:
        s = df[c]
        num_try = pd.to_numeric(s, errors="coerce")
        num_ratio = num_try.notna().mean()
        if num_ratio > 0.8:
            df[c] = num_try
            continue

        with warnings.catch_warnings():
            warnings.simplefilter("ignore", category=UserWarning)
            dt_try = pd.to_datetime(s, errors="coerce")
        dt_ratio = dt_try.notna().mean()
        if dt_ratio > 0.8:
            df[c] = dt_try
    return df


# ======================================================
# 🧩 Readers (CSV / Excel)
# ======================================================


def _read_csv_smart(path: str) -> pd.DataFrame:
    with warnings.catch_warnings():
        warnings.simplefilter("ignore", category=UserWarning)
        lines = []
        try:
            with open(path, "r", encoding="utf-8", errors="ignore") as f:
                for _ in range(6):
                    line = f.readline()
                    if not line:
                        break
                    lines.append(line)
        except Exception:
            pass

        header_row = 0
        if lines:
            try:
                peek = pd.read_csv(StringIO("".join(lines)), header=None, engine="python")
                header_row = _best_header_row_from_sample(
                    peek.fillna("").astype(str).values.tolist()
                )
            except Exception:
                pass

        try:
            df = pd.read_csv(path, engine="python", on_bad_lines="skip", header=header_row)
        except Exception:
            df = pd.read_csv(path, engine="python", on_bad_lines="skip", header=None)

        # Skip non-tabular title rows
        if not df.empty and df.shape[1] == 1 and df.iloc[0].astype(str).str.len().max() > 30:
            df = df.iloc[1:].reset_index(drop=True)

        if isinstance(df.columns, pd.RangeIndex) or any(
            "unnamed" in str(c).lower() for c in df.columns
        ):
            try:
                df2 = pd.read_csv(
                    path, engine="python", on_bad_lines="skip", header=[header_row, header_row + 1]
                )
                if isinstance(df2.columns, pd.MultiIndex):
                    df2.columns = [
                        " ".join(
                            [
                                str(x)
                                for x in tup
                                if str(x).strip().lower() not in ("nan", "none", "unnamed: 0")
                            ]
                        ).strip()
                        for tup in df2.columns.values
                    ]
                    df = df2
            except Exception:
                pass

        df.columns = _clean_and_dedupe_headers(df.columns)
        df = _drop_empty_edges(df)
        df = _coerce_common_types(df)
        return df


def _read_excel_smart(path: str) -> pd.DataFrame:
    with warnings.catch_warnings():
        warnings.simplefilter("ignore", category=UserWarning)
        try:
            peek = pd.read_excel(path, header=None, nrows=6)
            header_row = _best_header_row_from_sample(peek.fillna("").astype(str).values.tolist())
        except Exception:
            header_row = 0

        try:
            df = pd.read_excel(path, header=header_row)
        except Exception:
            df = pd.read_excel(path, header=None)

        # Skip title-like first row
        if not df.empty and df.shape[1] == 1 and df.iloc[0].astype(str).str.len().max() > 30:
            df = df.iloc[1:].reset_index(drop=True)

        if isinstance(df.columns, pd.RangeIndex) or any(
            "unnamed" in str(c).lower() for c in df.columns
        ):
            try:
                df2 = pd.read_excel(path, header=[header_row, header_row + 1])
                if isinstance(df2.columns, pd.MultiIndex):
                    df2.columns = [
                        " ".join(
                            [
                                str(x)
                                for x in tup
                                if str(x).strip().lower() not in ("nan", "none", "unnamed: 0")
                            ]
                        ).strip()
                        for tup in df2.columns.values
                    ]
                    df = df2
            except Exception:
                pass

        df.columns = _clean_and_dedupe_headers(df.columns)
        df = _drop_empty_edges(df)
        df = _coerce_common_types(df)
        return df


# ======================================================
# 🧩 Readers (Documents)
# ======================================================


def _docx_text(path: str, max_chars: int = 8000) -> Tuple[str, int]:
    if DocxDocument is None:
        return ("DOCX detected. Install `python-docx` for parsing.", 0)
    try:
        doc = DocxDocument(path)
        parts = []
        for p in doc.paragraphs:
            t = (p.text or "").strip()
            if t:
                parts.append(t)
            if sum(len(x) for x in parts) > max_chars:
                break
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
    if textract is None:
        return ("DOC detected. Install `textract` for legacy .doc parsing.", 0)
    try:
        raw = textract.process(path)
        text = (
            raw.decode("utf-8", errors="ignore")
            if isinstance(raw, (bytes, bytearray))
            else str(raw)
        )
        text = " ".join(text.split())[:max_chars]
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
        text = " ".join(" ".join(texts).split())[:max_chars]
        return text, len(text)
    except Exception as e:
        return (f"PDF parsing error: {e}", 0)


# ======================================================
# 🧩 Public API
# ======================================================


def scrutinize_file(file_path: str, original_name: str) -> Dict[str, Any]:
    ext = os.path.splitext(original_name)[1].lower().lstrip(".")
    size_bytes = os.path.getsize(file_path) if os.path.exists(file_path) else 0

    if ext in ("csv",):
        try:
            df = _read_csv_smart(file_path)
            return _structured_result(
                "csv",
                original_name,
                size_bytes,
                f"CSV detected: {len(df)} rows × {df.shape[1]} columns (smart header detection).",
                df,
            )
        except Exception as e:
            return _structured_result("csv", original_name, size_bytes, f"CSV read error: {e}")

    if ext in ("xlsx", "xls"):
        try:
            df = _read_excel_smart(file_path)
            return _structured_result(
                "excel",
                original_name,
                size_bytes,
                f"Excel detected: {len(df)} rows × {df.shape[1]} columns (smart header detection).",
                df,
            )
        except Exception as e:
            return _structured_result("excel", original_name, size_bytes, f"Excel read error: {e}")

    if ext in ("json",):
        try:
            df = pd.read_json(file_path)
        except Exception as e:
            return _structured_result("json", original_name, size_bytes, f"JSON read error: {e}")

        if not df.empty:
            return _structured_result(
                "json",
                original_name,
                size_bytes,
                f"JSON dataset detected: {len(df)} rows × {df.shape[1]} columns.",
                df,
            )
        else:
            try:
                with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                    raw = f.read(1200)
                return _structured_result(
                    "json",
                    original_name,
                    size_bytes,
                    "JSON detected (non-tabular).",
                    extras={
                        "preview": [{"raw_excerpt": raw}],
                        "confidence": 0.5,
                        "suggestions": ["Consider array-of-records JSON for richer analysis."],
                    },
                )
            except Exception as e:
                return _structured_result(
                    "json", original_name, size_bytes, f"JSON file read error: {e}"
                )

    if ext in ("docx",):
        text, n = _docx_text(file_path)
        return _structured_result(
            "docx",
            original_name,
            size_bytes,
            "DOCX detected — extracted summary." if n else text,
            extras={
                "summary_excerpt": _summarize_text(text, 1200),
                "extracted_chars": n,
                "confidence": 0.6 if n else 0.4,
                "suggestions": (
                    [
                        "For table-heavy DOCX, consider exporting tables to CSV/XLSX for deeper analysis.",
                        "Use the Intelligence module to generate an AI executive summary.",
                    ]
                    if n
                    else ["Install `python-docx` to parse DOCX files."]
                ),
            },
        )

    if ext in ("doc",):
        text, n = _doc_text(file_path)
        return _structured_result(
            "doc",
            original_name,
            size_bytes,
            "DOC detected — extracted summary." if n else text,
            extras={
                "summary_excerpt": _summarize_text(text, 1200),
                "extracted_chars": n,
                "confidence": 0.55 if n else 0.35,
                "suggestions": (
                    [
                        "Legacy .doc format detected. Converting to DOCX may improve parsing quality.",
                        "Export tables to CSV/XLSX for structured analysis.",
                    ]
                    if n
                    else ["Install `textract` to parse legacy DOC files."]
                ),
            },
        )

    if ext in ("pdf",):
        text, n = _pdf_text(file_path)
        return _structured_result(
            "pdf",
            original_name,
            size_bytes,
            "PDF detected — extracted summary." if n else text,
            extras={
                "summary_excerpt": _summarize_text(text, 1200),
                "extracted_chars": n,
                "confidence": 0.55 if n else 0.4,
                "suggestions": (
                    [
                        "For table-heavy PDFs, upload the source CSV/XLSX for best results.",
                        "Use the Intelligence module to generate an AI executive summary.",
                    ]
                    if n
                    else ["Install `PyPDF2` to parse PDF files."]
                ),
            },
        )

    if ext in ("txt",):
        try:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                text = f.read(16000)
            return _structured_result(
                "txt",
                original_name,
                size_bytes,
                "Plain text detected.",
                extras={
                    "summary_excerpt": _summarize_text(text, 1200),
                    "extracted_chars": len(text),
                    "confidence": 0.6,
                    "suggestions": [
                        "If this represents structured data, consider CSV for deeper analysis."
                    ],
                },
            )
        except Exception as e:
            return _structured_result("txt", original_name, size_bytes, f"TXT read error: {e}")

    return _structured_result(
        ext or "unknown",
        original_name,
        size_bytes,
        f"Unsupported or unknown file type: {ext or 'unknown'}",
        extras={
            "confidence": 0.2,
            "suggestions": ["Try CSV, XLSX, or JSON for structured analysis."],
        },
    )
