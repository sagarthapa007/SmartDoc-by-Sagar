
import uuid
from fastapi import APIRouter, UploadFile, File, HTTPException
from app.models.schemas import UploadResponse
from app.services.file_parser import parse_upload
from app.services.registry import REGISTRY

router = APIRouter()

@router.post("/upload", response_model=UploadResponse)
async def upload(file: UploadFile = File(...)):
    try:
        payload = await file.read()
        parsed = parse_upload(file.filename, payload)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse file: {e}")

    dataset_id = uuid.uuid4().hex[:12]
    REGISTRY[dataset_id] = parsed
    return UploadResponse(
        dataset_id=dataset_id,
        rows_sampled=min(len(parsed.get("rows", [])), 100),
        columns=parsed.get("headers", []),
        text_blocks=parsed.get("text_blocks")
    )
