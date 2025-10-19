
from fastapi import APIRouter, HTTPException
from app.services.action_executor import ActionExecutor

router = APIRouter()
executor = ActionExecutor()

@router.post("/export")
async def export_segment(payload: dict):
    try:
        return executor.export_segment(**payload)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
