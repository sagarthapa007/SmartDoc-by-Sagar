from fastapi import APIRouter, HTTPException
from typing import Dict, Any
from app.intelligence.chart_suggester import suggest_charts
from app.intelligence.insight_generator import persona_insights
from app.intelligence.explainer import explain

router = APIRouter()


@router.post("/intelligence/suggest_charts")
async def suggest(payload: Dict[str, Any]):
    try:
        cols = payload.get("columns") or []
        return suggest_charts(cols)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/intelligence/generate")
async def generate(payload: Dict[str, Any]):
    try:
        headers = payload.get("headers") or []
        rows = payload.get("rows") or []
        data_type = payload.get("data_type") or "generic_dataset"
        persona = payload.get("persona") or "manager"
        return persona_insights(headers, rows, data_type, persona)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/intelligence/explain")
async def explain_why(payload: Dict[str, Any]):
    try:
        headers = payload.get("headers") or []
        rows = payload.get("rows") or []
        question = payload.get("question") or ""
        return explain(headers, rows, question)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
