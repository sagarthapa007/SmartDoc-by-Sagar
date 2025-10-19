from fastapi import FastAPI, UploadFile, File, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from app.schemas import AnalyzeRequest, AnalyzeResponse
from app.services.insight_engine import compute_insights
from app.utils.io import read_dataframe, to_row_dicts
from app.utils.summarizer import narrate
from app.auth.routes import router as auth_router
from app.auth.deps import get_current_user

app = FastAPI(title="SmartDoc Backend", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/analyze", response_model=AnalyzeResponse)
def analyze_json(body: AnalyzeRequest, user: str = Depends(get_current_user)):
    try:
        result = compute_insights(body.rows, max_cells=body.options.max_cells)
        return AnalyzeResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/analyze/upload", response_model=AnalyzeResponse)
async def analyze_upload(file: UploadFile = File(...), user: str = Depends(get_current_user)):
    try:
        content = await file.read()
        df = read_dataframe(content, file.filename)
        rows = to_row_dicts(df)
        result = compute_insights(rows)
        return AnalyzeResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to process file: {e}")

@app.post("/narrate")
def narrative(body: AnalyzeRequest, user: str = Depends(get_current_user)):
    result = compute_insights(body.rows, max_cells=body.options.max_cells)
    return {"narrative": narrate(result)}
