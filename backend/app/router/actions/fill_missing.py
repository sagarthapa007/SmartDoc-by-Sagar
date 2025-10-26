from app.services.action_executor import ActionExecutor
from fastapi import APIRouter, HTTPException

router = APIRouter()
executor = ActionExecutor()


@router.post("/fill_missing")
async def fill_missing(payload: dict):
    try:
        return executor.fill_missing(**payload)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
