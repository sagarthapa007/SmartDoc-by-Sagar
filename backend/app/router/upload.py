import os, uuid, tempfile, math
from fastapi import APIRouter, UploadFile, File, HTTPException
from app.utils.file_scrutinizer import scrutinize_file

router = APIRouter(tags=["Upload"])

# ✅ Helper to recursively clean NaN / Inf values
def _sanitize_for_json(obj):
    """Recursively replace NaN/Inf in dicts/lists with None."""
    if isinstance(obj, dict):
        return {k: _sanitize_for_json(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [_sanitize_for_json(v) for v in obj]
    elif isinstance(obj, float):
        if math.isnan(obj) or math.isinf(obj):
            return None
        return obj
    else:
        return obj


@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    try:
        filename = file.filename
        contents = await file.read()

        # Cross-platform temp path + unique name
        temp_dir = tempfile.gettempdir()
        unique = f"{uuid.uuid4().hex}_{filename}"
        temp_path = os.path.join(temp_dir, unique)

        with open(temp_path, "wb") as f:
            f.write(contents)

        # ✅ Run scrutiny
        report = scrutinize_file(temp_path, filename)

        # ✅ Sanitize report (fixes NaN → None before JSON)
        sanitized = _sanitize_for_json(report)

        # Cleanup
        try:
            os.remove(temp_path)
        except Exception:
            pass

        # ✅ Clean JSON-safe response
        return {
            "upload_id": f"UPL-{abs(hash(filename)) % 100000}",
            "filename": filename,
            "filesize_bytes": len(contents),
            "filetype": sanitized.get("file_type"),
            "uploaded_at": sanitized.get("upload_time"),
            "scrutiny": sanitized,
            "status": "ok"
        }

    except Exception as e:
        import traceback; traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
