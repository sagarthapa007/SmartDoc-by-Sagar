
from fastapi import APIRouter, HTTPException
from app.services.action_executor import ActionExecutor

router = APIRouter()
executor = ActionExecutor()

@router.post("/remove_outliers")
async def remove_outliers(payload: dict):
    try:
        return executor.remove_outliers(**payload)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
