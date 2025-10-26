from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, Field

Persona = Literal["junior", "manager", "executive"]


class UploadResponse(BaseModel):
    dataset_id: str
    rows_sampled: int
    columns: List[str]
    text_blocks: Optional[List[str]] = None


class DetectRequest(BaseModel):
    headers: List[str]
    sample_rows: List[Dict[str, Any]] = []
    text_blocks: Optional[List[str]] = None


class DetectResponse(BaseModel):
    data_type: str
    confidence: float
    detected_columns: Dict[str, str] = Field(default_factory=dict)
    suggested_analyses: List[str] = Field(default_factory=list)
    persona_recommendations: Dict[str, List[str]] = Field(default_factory=dict)


class AnalyzeContext(BaseModel):
    data_type: str = "generic_dataset"
    persona: Persona = "manager"
    focus_areas: Optional[List[str]] = None
    dataset_id: Optional[str] = None


class AnalyzeRequest(BaseModel):
    headers: List[str] = []
    rows: List[Dict[str, Any]] = []
    text_blocks: Optional[List[str]] = None
    context: AnalyzeContext


class QuickAction(BaseModel):
    id: str
    title: str
    severity: Literal["info", "medium", "high"] = "info"
    action_url: str
    preview: Optional[str] = None
    filters: Optional[Dict[str, Any]] = None


class InsightItem(BaseModel):
    text: str
    drill_down_url: Optional[str] = None
    suggested_action: Optional[str] = None
    potential_impact: Optional[str] = None


class AnalyzeResponse(BaseModel):
    for_persona: Persona
    quick_actions: List[QuickAction] = []
    insights: Dict[str, List[InsightItem]] = Field(default_factory=dict)
    charts: Dict[str, Any] = Field(default_factory=dict)
    summary: Optional[str] = None
    quality: Optional[Dict[str, Any]] = None
    technical: Optional[Dict[str, Any]] = None
    business: Optional[Dict[str, Any]] = None
    narrative: Optional[Dict[str, Any]] = None


class DeduplicateRequest(BaseModel):
    dataset_id: str
    key_columns: List[str] = ["email"]
    strategy: Literal["keep_latest", "keep_first"] = "keep_latest"
    dry_run: bool = True


class DeduplicatePreview(BaseModel):
    will_remove: int
    will_keep: int
    affected_records: List[Dict[str, Any]]
    execute_url: str


class ExploreQuery(BaseModel):
    filters: List[Dict[str, Any]] = []
    group_by: Optional[str] = None
    aggregate: Optional[Dict[str, str]] = None
    sort: Optional[Dict[str, str]] = None
    limit: Optional[int] = 100


class ExploreRequest(BaseModel):
    dataset_id: str
    query: ExploreQuery


class ExploreResponse(BaseModel):
    results: List[Dict[str, Any]] = []
    total_matched: int = 0
    sql_equivalent: Optional[str] = None
    save_as_view: Optional[str] = None
