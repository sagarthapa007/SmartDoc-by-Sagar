
from fastapi import APIRouter, HTTPException, Query
from app.models.schemas import DeduplicateRequest, DeduplicatePreview
from app.services.action_executor import ActionExecutor

router = APIRouter()
executor = ActionExecutor()

@router.post("/deduplicate", response_model=DeduplicatePreview)
async def deduplicate(req: DeduplicateRequest):
    try:
        preview = executor.deduplicate(req.dataset_id, req.key_columns, req.strategy, req.dry_run)
        return preview
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
