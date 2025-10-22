from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import List, Dict, Any
from app.routes.auth_routes import get_current_user
from app.services.analyze import correlate

router = APIRouter(tags=["correlate"])

class CorrelatePayload(BaseModel):
    rows: List[Dict[str, Any]]
    target: str

@router.post("/api/correlate")
def correlate_api(payload: CorrelatePayload, user=Depends(get_current_user)):
    return correlate(payload.rows, payload.target)
