from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import Optional
import pandas as pd
import io, os
from app.services.data_detector_ml import SmartDataTypeDetector

router = APIRouter(prefix="/detect", tags=["Detect"])
detector = SmartDataTypeDetector()

@router.post("/")
async def detect(file: Optional[UploadFile] = File(None), upload_id: Optional[str] = Form(None)):
    """
    🧠 SmartDoc Detection Endpoint
    Accepts either a file upload or an existing upload_id (from /api/upload).
    Analyzes the file structure to generate schema, quality report, and preview.
    """
    try:
        # ✅ Load file data
        if file:
            file_bytes = await file.read()
            filename = file.filename
            ext = os.path.splitext(filename)[1].lower().strip(".")
            df = _read_file_to_df(file_bytes, ext)
        elif upload_id:
            # Locate file from your upload directory
            filepath = f"./uploads/{upload_id}"
            if not os.path.exists(filepath):
                raise HTTPException(status_code=404, detail=f"No uploaded file found for {upload_id}")
            ext = os.path.splitext(filepath)[1].lower().strip(".")
            df = _read_file_to_df(open(filepath, "rb").read(), ext)
        else:
            raise HTTPException(status_code=400, detail="No file or upload_id provided.")

        # ✅ Run your ML data-type detector
        headers = list(df.columns)
        sample_rows = df.head(10).to_dict(orient="records")
        result = detector.detect(headers, sample_rows, [])

        # ✅ Build scrutiny object
        scrutiny = {
            "upload_id": upload_id or "unknown",
            "file_type": ext,
            "rows_detected": len(df),
            "columns_detected": len(df.columns),
            "schema": result.get("schema", []),
            "quality": result.get("quality", {}),
            "preview": sample_rows,
            "summary_excerpt": f"Detected {len(df.columns)} columns and {len(df)} rows from {ext.upper()} file.",
            "persona_recommendations": {
                "junior": ["data_cleaning", "duplicate_detection"],
                "manager": ["trend_analysis", "team_performance"],
                "executive": ["kpi_dashboard", "roi_metrics"]
            }
        }
        return scrutiny

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

def _read_file_to_df(file_bytes, ext):
    """ Helper to load various file types into pandas DataFrame """
    if ext in ["csv"]:
        return pd.read_csv(io.BytesIO(file_bytes))
    elif ext in ["xlsx", "xls"]:
        return pd.read_excel(io.BytesIO(file_bytes))
    elif ext in ["json"]:
        return pd.read_json(io.BytesIO(file_bytes))
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {ext}")
