import math
import os
import tempfile
import uuid

from app.utils.file_scrutinizer import scrutinize_file  # ✅ your enterprise-grade function
from fastapi import APIRouter, File, HTTPException, UploadFile

router = APIRouter(tags=["Upload"])


# ============================================================
# 🧩 Helper — make JSON safe (no NaN / Inf)
# ============================================================
def _sanitize_for_json(obj):
    """Recursively replace NaN/Inf with None."""
    if isinstance(obj, dict):
        return {k: _sanitize_for_json(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [_sanitize_for_json(v) for v in obj]
    elif isinstance(obj, float):
        if math.isnan(obj) or math.isinf(obj):
            return None
    return obj


# ============================================================
# 🚀 Upload + Scrutiny Endpoint
# ============================================================
@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    """
    Upload any file (CSV, XLSX, JSON, DOCX, PDF, etc.)
    → Auto-scrutinized by SmartDoc engine
    → Returns unified JSON for frontend preview + analysis.
    """
    try:
        # Step 1: Read + store temporarily
        filename = file.filename
        contents = await file.read()

        temp_dir = tempfile.gettempdir()
        unique_name = f"{uuid.uuid4().hex}_{filename}"
        temp_path = os.path.join(temp_dir, unique_name)

        with open(temp_path, "wb") as f:
            f.write(contents)

        # Step 2: Run scrutiny
        print(f"📂 Scrutinizing file: {filename} ({len(contents)} bytes)")
        report = scrutinize_file(temp_path, filename)
        sanitized = _sanitize_for_json(report)

        # Step 3: Cleanup temp file
        try:
            os.remove(temp_path)
        except Exception:
            pass

        # Step 4: Generate unique upload_id
        upload_id = f"UPL-{abs(hash(filename)) % 100000}-{uuid.uuid4().hex[:6].upper()}"

        # Step 5: Return clean response
        response = {
            "upload_id": upload_id,
            "filename": filename,
            "filesize_bytes": len(contents),
            "filetype": sanitized.get("file_type", "unknown"),
            "uploaded_at": sanitized.get("upload_time"),
            "scrutiny": sanitized,
            "status": "ok",
        }

        print(f"✅ Upload processed: {upload_id} ({filename})")
        return response

    except Exception as e:
        import traceback

        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Upload failed: {e}")
