
from collections import Counter
from typing import Dict, List, Any, Optional
import re

SALES_HINTS = {"amount","revenue","customer","product","order","invoice","qty","quantity"}
HR_HINTS = {"employee","salary","department","designation","doj","email","role","grade"}
FIN_HINTS = {"p&l","balance","ledger","expense","income","asset","liability","gl","account"}

DATE_PAT = re.compile(r"\d{4}-\d{2}-\d{2}")

class DataDetector:
    def detect(self, headers: List[str], sample_rows: List[Dict[str, Any]], text_blocks: Optional[List[str]] = None):
        tokens = {str(h).strip().lower() for h in (headers or [])}
        score = {
            "sales_transactional": len(tokens & SALES_HINTS),
            "hr_roster": len(tokens & HR_HINTS),
            "financial_statement": len(tokens & FIN_HINTS),
        }
        data_type = max(score, key=score.get) if score else "generic_dataset"
        confidence = min(0.3 + (score.get(data_type, 0) / max(len(tokens) or 1, 1)), 0.98)

        persona_recos = {
            "junior": ["data_cleaning","duplicate_detection"],
            "manager": ["trend_analysis","team_performance"],
            "executive": ["kpi_dashboard","roi_metrics"]
        }
        detected_columns = {}
        # naive mapping
        for k in tokens:
            if k in {"amount","revenue","sales"}: detected_columns["revenue"] = k
            if k in {"customer","client","name"}: detected_columns["customer"] = k
            if k in {"date","order_date","doj"}: detected_columns["date"] = k

        suggested = {
            "sales_transactional": ["revenue_trends","customer_segmentation","conversion_funnel"],
            "hr_roster": ["headcount","attrition","salary_bands"],
            "financial_statement": ["pnl_overview","expense_breakdown","cash_flow"],
            "generic_dataset": ["basic_stats","distributions","correlations"],
        }.get(data_type, ["basic_stats"])

        return {
            "data_type": data_type,
            "confidence": round(confidence, 2),
            "detected_columns": detected_columns,
            "suggested_analyses": suggested,
            "persona_recommendations": persona_recos,
        }
