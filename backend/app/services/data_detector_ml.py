"""
🧠 SmartDoc - Data Detector (Enhanced ML + Robust Keyword Fallback)
-------------------------------------------------------------------
This service powers the `/api/detect` endpoint with enhanced capabilities.

It first tries to load the trained TF-IDF + Logistic Regression model.
If not found, it uses enhanced keyword-based heuristics with fuzzy matching.
"""

import logging
import os
import re
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

import joblib
import numpy as np

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "ml", "data_type_model.pkl")
CACHE_DIR = os.path.join(os.path.dirname(__file__), "..", "cache")

# -----------------------------
# 1️⃣ Enhanced Keyword Fallback Patterns
# -----------------------------
ENHANCED_DOMAIN_KEYWORDS = {
    "hr": {
        "primary": ["employee", "department", "salary", "payroll", "attendance", "designation"],
        "secondary": ["hire", "termination", "performance", "review", "benefits", "compensation"],
        "weight": 1.2,
    },
    "sales": {
        "primary": ["revenue", "sales", "amount", "customer", "region", "invoice", "order"],
        "secondary": ["quota", "commission", "pipeline", "territory", "deal", "forecast"],
        "weight": 1.1,
    },
    "finance": {
        "primary": ["ledger", "account", "credit", "debit", "loan", "gst", "tax"],
        "secondary": ["balance", "expense", "asset", "liability", "audit", "budget"],
        "weight": 1.1,
    },
    "personal_expense": {
        "primary": ["expense", "category", "note", "fuel", "groceries", "payment_mode"],
        "secondary": ["budget", "savings", "spending", "transaction", "receipt"],
        "weight": 1.0,
    },
    "admin": {
        "primary": ["policy", "vendor", "contract", "compliance", "approval", "office"],
        "secondary": ["facility", "asset", "maintenance", "procurement", "document"],
        "weight": 1.0,
    },
    "procurement": {
        "primary": ["po_number", "supplier", "item", "purchase", "cost"],
        "secondary": ["vendor", "order", "delivery", "inventory", "requisition"],
        "weight": 1.0,
    },
    "marketing": {
        "primary": ["campaign", "impressions", "clicks", "budget", "reach", "ad_spend"],
        "secondary": ["conversion", "roi", "lead", "audience", "engagement", "ctr"],
        "weight": 1.0,
    },
    "it": {
        "primary": ["device", "software", "ticket", "server", "user", "network"],
        "secondary": ["support", "incident", "system", "application", "security"],
        "weight": 1.0,
    },
    "factory": {
        "primary": ["machine", "operator", "shift", "maintenance", "batch", "yield"],
        "secondary": ["production", "quality", "defect", "downtime", "efficiency"],
        "weight": 1.0,
    },
    "manufacturing": {
        "primary": ["production", "raw_material", "qc", "assembly", "process"],
        "secondary": ["manufacturing", "component", "inspection", "batch", "output"],
        "weight": 1.0,
    },
    "personal_life": {
        "primary": ["habit", "goal", "mood", "sleep", "energy", "reflection"],
        "secondary": ["wellness", "fitness", "health", "routine", "progress"],
        "weight": 1.0,
    },
    "healthcare": {
        "primary": ["patient", "diagnosis", "treatment", "medication", "hospital"],
        "secondary": ["medical", "health", "clinical", "therapy", "appointment"],
        "weight": 1.0,
    },
    "education": {
        "primary": ["student", "grade", "course", "attendance", "performance"],
        "secondary": ["teacher", "class", "assignment", "exam", "curriculum"],
        "weight": 1.0,
    },
    "ecommerce": {
        "primary": ["product", "sku", "price", "inventory", "category", "review"],
        "secondary": ["order", "shipping", "customer", "cart", "payment"],
        "weight": 1.0,
    },
}

# -----------------------------
# 2️⃣ Enhanced Utility Functions
# -----------------------------


def enhanced_preprocess_text(text):
    """Enhanced text preprocessing with better normalization and pattern recognition."""
    if isinstance(text, list):
        text = " ".join(str(item) for item in text)
    else:
        text = str(text)

    text = text.lower().strip()

    # Enhanced cleaning - keep more meaningful characters
    text = re.sub(r"[^a-z0-9, _\-]+", " ", text)

    # Normalize spaces and commas
    text = re.sub(r"\s+", " ", text)
    text = re.sub(r",\s*", ", ", text)

    # Extract and preserve numeric patterns
    numeric_patterns = re.findall(r"\b\d+\.?\d*\b", text)

    return text.strip()


def extract_column_patterns(headers):
    """Extract patterns from column names for better domain detection."""
    patterns = {
        "has_ids": any(re.search(r"\b(id|_id|num|no|number|code)\b", h.lower()) for h in headers),
        "has_dates": any(re.search(r"\b(date|time|day|month|year)\b", h.lower()) for h in headers),
        "has_amounts": any(
            re.search(r"\b(amount|price|cost|value|total|sum)\b", h.lower()) for h in headers
        ),
        "has_names": any(
            re.search(r"\b(name|title|description|note|remark)\b", h.lower()) for h in headers
        ),
        "has_status": any(
            re.search(r"\b(status|state|flag|active|completed)\b", h.lower()) for h in headers
        ),
    }
    return patterns


def create_cache_dir():
    """Ensure cache directory exists."""
    try:
        os.makedirs(CACHE_DIR, exist_ok=True)
        return True
    except Exception as e:
        logger.warning(f"Could not create cache directory: {e}")
        return False


# -----------------------------
# 3️⃣ Enhanced Model Loading with Caching
# -----------------------------


def load_model_with_fallback():
    """Enhanced model loading with caching and multiple fallback strategies."""
    model_info = {"model": None, "vectorizer": None, "loaded_at": None, "method": "none"}

    # Try to load from cache first
    cache_file = os.path.join(CACHE_DIR, "model_cache.pkl") if create_cache_dir() else None

    if cache_file and os.path.exists(cache_file):
        try:
            cached_data = joblib.load(cache_file)
            # Check if cache is recent (less than 1 hour old)
            if (
                cached_data.get("timestamp")
                and (datetime.now() - cached_data["timestamp"]).total_seconds() < 3600
            ):
                model_info.update(cached_data["model_info"])
                model_info["method"] = "cached"
                logger.info("✅ Model loaded from cache")
                return model_info
        except Exception as e:
            logger.warning(f"Cache load failed: {e}")

    # Try primary model path
    if os.path.exists(MODEL_PATH):
        try:
            data = joblib.load(MODEL_PATH)
            model_info.update(
                {
                    "model": data.get("model"),
                    "vectorizer": data.get("vectorizer"),
                    "loaded_at": datetime.now(),
                    "method": "primary",
                }
            )
            logger.info("✅ Model loaded from primary path")

            # Cache the model info
            if cache_file:
                try:
                    joblib.dump({"model_info": model_info, "timestamp": datetime.now()}, cache_file)
                except Exception as e:
                    logger.warning(f"Could not cache model: {e}")

        except Exception as e:
            logger.error(f"⚠️ Failed to load model from primary path: {e}")

    return model_info


# Initialize model
MODEL_INFO = load_model_with_fallback()

# -----------------------------
# 4️⃣ Enhanced Detection Logic
# -----------------------------


def enhanced_keyword_detection(text, headers):
    """Enhanced keyword-based detection with weighted scoring and pattern analysis."""
    scores = {}
    column_patterns = extract_column_patterns(headers)

    for domain, config in ENHANCED_DOMAIN_KEYWORDS.items():
        primary_matches = sum(1 for w in config["primary"] if w in text)
        secondary_matches = sum(1 for w in config["secondary"] if w in text)

        # Weighted scoring
        base_score = (primary_matches * 2) + secondary_matches
        weighted_score = base_score * config["weight"]

        # Pattern bonuses
        if domain == "finance" and column_patterns["has_amounts"]:
            weighted_score += 2
        elif domain == "hr" and column_patterns["has_names"]:
            weighted_score += 1
        elif domain in ["sales", "ecommerce"] and column_patterns["has_amounts"]:
            weighted_score += 1.5

        scores[domain] = weighted_score

    # Normalize scores to 0-1 range
    max_score = max(scores.values()) if scores else 1
    normalized_scores = {domain: score / max_score for domain, score in scores.items()}

    best_domain = max(scores, key=scores.get) if scores else "unknown"
    confidence = normalized_scores.get(best_domain, 0.0)

    # Get top 3 alternatives
    alternatives = sorted(
        [(domain, score) for domain, score in normalized_scores.items() if domain != best_domain],
        key=lambda x: x[1],
        reverse=True,
    )[:3]

    return best_domain, confidence, alternatives


def detect_data_type(headers, sample_rows=None, include_detailed_info=False):
    """
    Enhanced data type detection with comprehensive analysis.

    Returns {
        data_type, confidence, detected_columns, suggested_analyses,
        method, alternatives, column_patterns, processing_time
    }
    """
    start_time = datetime.now()

    # Prepare input text with enhanced processing
    text = enhanced_preprocess_text(headers)

    # Include sample values for better prediction
    if sample_rows:
        try:
            sample_text = " ".join(
                str(value)
                for row in sample_rows[:100]  # Limit to first 100 rows for performance
                for value in row.values()
                if value and str(value).strip()
            )
            text += " " + enhanced_preprocess_text(sample_text)
        except Exception as e:
            logger.warning(f"Sample processing failed: {e}")

    result = {
        "data_type": "unknown",
        "confidence": 0.0,
        "method": "unknown",
        "suggested_analyses": [],
        "persona_recommendations": {},
        "detected_columns": len(headers) if isinstance(headers, list) else 1,
        "alternatives": [],
        "column_patterns": {},
        "processing_time_ms": 0,
        "model_used": MODEL_INFO["method"],
    }

    # ---------- Enhanced ML Prediction ----------
    if MODEL_INFO["model"] and MODEL_INFO["vectorizer"]:
        try:
            vec = MODEL_INFO["vectorizer"].transform([text])
            probs = MODEL_INFO["model"].predict_proba(vec)[0]
            labels = MODEL_INFO["model"].classes_

            idx = int(np.argmax(probs))
            data_type = labels[idx]
            confidence = float(probs[idx])

            # Get top alternatives
            prob_indices = np.argsort(probs)[::-1]
            alternatives = [
                {"type": labels[i], "confidence": float(probs[i])}
                for i in prob_indices[1:4]
                if probs[i] > 0.1  # Only include meaningful alternatives
            ]

            result.update(
                {
                    "data_type": data_type,
                    "confidence": round(confidence, 3),
                    "method": "ml",
                    "alternatives": alternatives,
                    "suggested_analyses": suggest_analyses(data_type),
                    "persona_recommendations": persona_map(data_type),
                }
            )

        except Exception as e:
            logger.error(f"⚠️ ML prediction failed: {e}")
            # Fall through to keyword detection

    # ---------- Enhanced Keyword Fallback ----------
    if result["method"] == "unknown":
        try:
            headers_list = headers if isinstance(headers, list) else [headers]
            best_domain, confidence, alternatives = enhanced_keyword_detection(text, headers_list)

            result.update(
                {
                    "data_type": best_domain,
                    "confidence": round(confidence, 2),
                    "method": "keyword",
                    "alternatives": [
                        {"type": alt[0], "confidence": round(alt[1], 2)} for alt in alternatives
                    ],
                    "suggested_analyses": suggest_analyses(best_domain),
                    "persona_recommendations": persona_map(best_domain),
                }
            )
        except Exception as e:
            logger.error(f"⚠️ Keyword detection failed: {e}")
            # Final fallback
            result.update(
                {
                    "data_type": "generic",
                    "confidence": 0.1,
                    "method": "fallback",
                    "suggested_analyses": ["basic_summary", "pattern_detection"],
                    "persona_recommendations": persona_map("generic"),
                }
            )

    # Add column patterns and processing time
    result["column_patterns"] = extract_column_patterns(
        headers if isinstance(headers, list) else [headers]
    )
    result["processing_time_ms"] = round((datetime.now() - start_time).total_seconds() * 1000, 2)

    if include_detailed_info:
        result["processed_text"] = text[:500]  # Include first 500 chars for debugging
        result["sample_count"] = len(sample_rows) if sample_rows else 0

    return result


# -----------------------------
# 5️⃣ Enhanced Helper: Suggested Analyses
# -----------------------------


def suggest_analyses(domain):
    """Enhanced analysis suggestions with priority ordering."""
    suggestions = {
        "sales": [
            "revenue_trends",
            "customer_segmentation",
            "conversion_funnel",
            "sales_performance",
            "regional_analysis",
            "product_performance",
        ],
        "hr": [
            "headcount_analysis",
            "salary_distribution",
            "attendance_trends",
            "performance_reviews",
            "turnover_analysis",
            "department_breakdown",
        ],
        "finance": [
            "pnl_summary",
            "expense_breakdown",
            "cashflow_forecast",
            "budget_vs_actual",
            "financial_ratios",
            "trend_analysis",
        ],
        "marketing": [
            "campaign_performance",
            "roi_tracking",
            "lead_conversion",
            "channel_effectiveness",
            "audience_analysis",
            "engagement_metrics",
        ],
        "procurement": [
            "supplier_performance",
            "purchase_trends",
            "cost_analysis",
            "vendor_comparison",
            "inventory_turnover",
            "savings_analysis",
        ],
        "factory": [
            "machine_utilization",
            "downtime_analysis",
            "production_efficiency",
            "quality_metrics",
            "shift_comparison",
            "maintenance_scheduling",
        ],
        "manufacturing": [
            "batch_yield",
            "defect_trends",
            "production_volume",
            "process_optimization",
            "quality_control",
            "throughput_analysis",
        ],
        "personal_expense": [
            "spending_pattern",
            "budget_comparison",
            "category_breakdown",
            "trend_analysis",
            "savings_rate",
            "expense_forecasting",
        ],
        "it": [
            "ticket_resolution_time",
            "device_uptime",
            "system_performance",
            "incident_trends",
            "user_satisfaction",
            "resource_utilization",
        ],
        "admin": [
            "policy_compliance",
            "asset_audit",
            "vendor_management",
            "contract_tracking",
            "facility_utilization",
            "cost_optimization",
        ],
        "personal_life": [
            "habit_trends",
            "wellness_score",
            "goal_progress",
            "mood_correlation",
            "routine_analysis",
            "improvement_tracking",
        ],
        "healthcare": [
            "patient_outcomes",
            "treatment_effectiveness",
            "resource_utilization",
            "appointment_analysis",
            "medication_tracking",
            "clinical_metrics",
        ],
        "education": [
            "student_performance",
            "attendance_correlation",
            "grade_distribution",
            "course_effectiveness",
            "learning_progress",
            "assessment_analysis",
        ],
        "ecommerce": [
            "sales_performance",
            "customer_behavior",
            "inventory_optimization",
            "conversion_analysis",
            "product_reviews",
            "shipping_efficiency",
        ],
        "generic": [
            "basic_summary",
            "pattern_detection",
            "outlier_identification",
            "correlation_analysis",
            "trend_detection",
            "data_quality_check",
        ],
    }
    return suggestions.get(domain, suggestions["generic"])


# -----------------------------
# 6️⃣ Enhanced Helper: Persona Map
# -----------------------------


def persona_map(domain):
    """Enhanced persona-based recommendations with domain-specific focus."""
    base_recommendations = {
        "junior": ["data_cleaning", "duplicate_detection", "basic_summary", "validation_checks"],
        "manager": ["trend_analysis", "team_performance", "kpi_tracking", "comparison_reports"],
        "executive": ["kpi_dashboard", "roi_metrics", "strategic_insights", "performance_overview"],
    }

    # Domain-specific enhancements
    domain_enhancements = {
        "sales": {
            "junior": ["lead_tracking", "customer_data_validation"],
            "manager": ["pipeline_analysis", "team_quota_performance"],
            "executive": ["revenue_forecast", "market_share_analysis"],
        },
        "finance": {
            "junior": ["expense_categorization", "transaction_validation"],
            "manager": ["budget_variance", "department_spending"],
            "executive": ["financial_health", "investment_roi"],
        },
        "hr": {
            "junior": ["employee_data_cleanup", "attendance_records"],
            "manager": ["team_capacity", "performance_trends"],
            "executive": ["workforce_planning", "talent_retention"],
        },
    }

    enhanced_recommendations = base_recommendations.copy()

    # Apply domain-specific enhancements
    if domain in domain_enhancements:
        for persona in enhanced_recommendations:
            if persona in domain_enhancements[domain]:
                enhanced_recommendations[persona].extend(domain_enhancements[domain][persona])

    return enhanced_recommendations


# -----------------------------
# 7️⃣ Enhanced Testing and Diagnostics
# -----------------------------


def test_detection():
    """Comprehensive test function for detection service."""
    test_cases = [
        {
            "name": "HR Data",
            "headers": ["employee_id", "name", "department", "salary", "hire_date"],
            "expected": "hr",
        },
        {
            "name": "Sales Data",
            "headers": ["customer", "order_amount", "region", "order_date", "product"],
            "expected": "sales",
        },
        {
            "name": "Finance Data",
            "headers": ["account_number", "transaction_amount", "balance", "date"],
            "expected": "finance",
        },
        {
            "name": "Mixed Data",
            "headers": ["id", "description", "value", "category", "timestamp"],
            "expected": "generic",
        },
    ]

    print("🧠 Enhanced Data Detector - Test Suite")
    print("=" * 50)

    for test in test_cases:
        result = detect_data_type(test["headers"])
        status = "✅" if result["data_type"] == test["expected"] else "❌"
        print(f"{status} {test['name']}:")
        print(f"   Expected: {test['expected']}, Got: {result['data_type']}")
        print(f"   Confidence: {result['confidence']}, Method: {result['method']}")
        print(f"   Time: {result['processing_time_ms']}ms")

        if result["alternatives"]:
            print(f"   Alternatives: {[alt['type'] for alt in result['alternatives'][:2]]}")
        print()


if __name__ == "__main__":
    test_detection()

    # Interactive testing
    print("\n🎯 Interactive Testing (enter 'quit' to exit):")
    while True:
        try:
            user_input = input("\nEnter column headers (comma separated): ").strip()
            if user_input.lower() == "quit":
                break
            if user_input:
                headers = [h.strip() for h in user_input.split(",")]
                result = detect_data_type(headers, include_detailed_info=True)
                print(f"\n📊 Results:")
                print(f"   Data Type: {result['data_type']} (confidence: {result['confidence']})")
                print(f"   Method: {result['method']}")
                print(f"   Processing Time: {result['processing_time_ms']}ms")
                print(f"   Suggested Analyses: {result['suggested_analyses'][:3]}")
        except KeyboardInterrupt:
            print("\n👋 Exiting...")
            break
        except Exception as e:
            print(f"❌ Error: {e}")

# ====================================================
# 🧩 SmartDataTypeDetector Wrapper (for FastAPI route)
# ====================================================


class SmartDataTypeDetector:
    """
    Thin wrapper around detect_data_type() for route integration.
    """

    def detect(self, headers, sample_rows=None, text_blocks=None):
        try:
            # text_blocks ignored here (used only for extended context)
            result = detect_data_type(headers, sample_rows)
            return result
        except Exception as e:
            return {"error": str(e), "data_type": "unknown"}
