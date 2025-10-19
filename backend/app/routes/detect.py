
from fastapi import APIRouter, HTTPException
from typing import Dict, Any
from app.services.data_detector_ml import SmartDataTypeDetector

router = APIRouter()
detector = SmartDataTypeDetector()

@router.post("/detect")
async def detect(payload: Dict[str, Any]):
    try:
        headers = payload.get("headers") or []
        sample_rows = payload.get("sample_rows") or []
        text_blocks = payload.get("text_blocks") or []
        result = detector.detect(headers, sample_rows, text_blocks)
        result["persona_recommendations"] = {
            "junior": ["data_cleaning","duplicate_detection"],
            "manager": ["trend_analysis","team_performance"],
            "executive": ["kpi_dashboard","roi_metrics"]
        }
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
