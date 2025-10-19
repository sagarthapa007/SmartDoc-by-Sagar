from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import upload, detect, analyze, explore, intelligence
from app.routes.actions import deduplicate, fill_missing, remove_outliers, export

# Initialize app FIRST ✅
app = FastAPI(title="SmartDoc G4+ API", version="0.3.0")

# Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten later (e.g., ["http://localhost:5174"])
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Core feature routes
app.include_router(upload.router, prefix="/api", tags=["upload"])
app.include_router(detect.router, prefix="/api", tags=["detect"])
app.include_router(analyze.router, prefix="/api", tags=["analyze"])
app.include_router(explore.router, prefix="/api", tags=["explore"])
app.include_router(intelligence.router, prefix="/api", tags=["intelligence"])

# Action routes (data cleaning utilities)
app.include_router(deduplicate.router, prefix="/api/actions", tags=["actions"])
app.include_router(fill_missing.router, prefix="/api/actions", tags=["actions"])
app.include_router(remove_outliers.router, prefix="/api/actions", tags=["actions"])
app.include_router(export.router, prefix="/api/actions", tags=["actions"])

# Health check
@app.get("/api/health")
def health():
    return {"status": "ok", "version": "0.3.0"}
