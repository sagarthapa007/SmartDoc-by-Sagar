from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware
from app.routes.explore_routes import router as explore_router

app = FastAPI(title="SmartDoc G5 API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(explore_router, prefix="/api")

@app.get("/api/health")
def health():
    return {"ok": True}
