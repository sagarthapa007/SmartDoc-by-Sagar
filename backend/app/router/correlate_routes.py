from typing import Any, Dict, List

from app.router.auth_routes import get_current_user
from app.services.analyze import correlate
from fastapi import APIRouter, Depends
from pydantic import BaseModel

router = APIRouter(tags=["correlate"])


class CorrelatePayload(BaseModel):
    rows: List[Dict[str, Any]]
    target: str


@router.post("/correlate")
def correlate_api(payload: CorrelatePayload, user=Depends(get_current_user)):
    return correlate(payload.rows, payload.target)
