from app.models.schemas import ExploreRequest, ExploreResponse
from app.services.query_builder import run_explore_query
from fastapi import APIRouter, HTTPException

router = APIRouter()


@router.post("/explore", response_model=ExploreResponse)
async def explore(req: ExploreRequest):
    try:
        res = run_explore_query(req.dataset_id, req.query.dict())
        return ExploreResponse(**res)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
