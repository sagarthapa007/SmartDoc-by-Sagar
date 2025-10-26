from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from app.router.auth_routes import require_role, get_current_user
from app.services.analyze import explore_query

router = APIRouter(tags=["explore"])

class ExplorePayload(BaseModel):
    rows: List[Dict[str, Any]] = []
    metric: str
    dimension: Optional[str] = None

@router.post("/api/explore")
def explore(payload: ExplorePayload, user=Depends(get_current_user)):
    # viewer+ allowed
    result = explore_query(payload.rows, payload.metric, payload.dimension)
    return result
