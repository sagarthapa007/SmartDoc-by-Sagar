
from fastapi import APIRouter, HTTPException
from app.models.schemas import AnalyzeRequest, AnalyzeResponse, QuickAction, InsightItem
from app.services.insight_engine import InsightEngine

router = APIRouter()
engine = InsightEngine()

@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze(req: AnalyzeRequest):
    try:
        result = engine.run(req.headers, req.rows, req.text_blocks, req.context.dict())
        # Shape: {for_persona, quick_actions, insights, charts, summary, quality, technical, business, narrative}
        return AnalyzeResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
