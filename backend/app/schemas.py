from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class AnalyzeOptions(BaseModel):
    max_cells: int = Field(200000)

class AnalyzeRequest(BaseModel):
    rows: List[Dict[str, Any]] = []
    options: AnalyzeOptions = AnalyzeOptions()

class Summary(BaseModel):
    rows: int
    columns: int
    numericColumns: int
    categoricalColumns: int
    dateColumns: int

class NumericStat(BaseModel):
    column: str
    n: int
    mean: Optional[float] = None
    std: Optional[float] = None
    min: Optional[float] = None
    max: Optional[float] = None
    q1: Optional[float] = None
    q3: Optional[float] = None
    iqr: Optional[float] = None
    outliers: int

class TopCategory(BaseModel):
    value: str; count: int; pct: float

class CategoricalStat(BaseModel):
    column: str; total: int; uniques: int; dominant: float; top5: List[TopCategory]

class Correlation(BaseModel):
    a: str; b: str; r: float

class Insight(BaseModel):
    id: str; type: str; title: str; detail: str
    severity: Optional[str] = None

class AnalyzeResponse(BaseModel):
    summary: Summary
    schema: List[Dict[str, Any]]
    numericStats: List[NumericStat]
    categoricalStats: List[CategoricalStat]
    correlations: List[Correlation]
    insights: List[Insight]
