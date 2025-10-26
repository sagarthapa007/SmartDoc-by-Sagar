from typing import Any, Dict, List, Optional

from app.router.auth_routes import get_current_user, require_role
from app.services.analyze import explore_query
from fastapi import APIRouter, Depends
from pydantic import BaseModel

router = APIRouter(tags=["explore"])


class ExplorePayload(BaseModel):
    rows: List[Dict[str, Any]] = []
    metric: str
    dimension: Optional[str] = None


@router.post("/explore")
def explore(payload: ExplorePayload, user=Depends(get_current_user)):
    # viewer+ allowed
    result = explore_query(payload.rows, payload.metric, payload.dimension)
    return result
