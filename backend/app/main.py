from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.routing import APIRoute
from app.config import settings
import json
import numpy as np
import socket
import logging

# ============================================================
# 🧩 Safe JSON Response — prevents NaN / Inf serialization errors
# ============================================================
class SafeJSONResponse(JSONResponse):
    def render(self, content):
        def safe_json_default(obj):
            if isinstance(obj, float):
                if np.isnan(obj) or np.isinf(obj):
                    return None
            return obj
        return json.dumps(content, default=safe_json_default, allow_nan=False).encode("utf-8")


# ============================================================
# 🚀 Initialize FastAPI App
# ============================================================
app = FastAPI(
    title="SmartDoc Enterprise API",
    version="6.3",
    description="Backend API powering SmartDoc data intelligence suite.",
    default_response_class=SafeJSONResponse
)


# ============================================================
# 🌐 Dynamic CORS Configuration
# ============================================================
origins = set(settings.allowed_origins_list)

# 🧠 Auto-detect local development hosts
if any("localhost" in o or "127.0.0.1" in o for o in origins):
    local_ips = {"http://localhost:5174", "http://127.0.0.1:5174"}
    try:
        ip = socket.gethostbyname(socket.gethostname())
        local_ips.add(f"http://{ip}:5174")
    except Exception:
        pass
    origins |= local_ips

app.add_middleware(
    CORSMiddleware,
    allow_origins=list(origins),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

print("🚀 Active CORS Origins:", list(origins))
print("🧩 API Base URL:", settings.API_BASE_URL)
print("🌐 Environment variables loaded successfully ✅")


# ============================================================
# 🔌 Import & Register All Routers
# ============================================================
from app.router.upload import router as upload_router
from app.router.analyze import router as analyze_router
from app.router.explore_routes import router as explore_router
from app.router.intelligence import router as intelligence_router
from app.router.history import router as history_router
from app.router.auth_routes import router as auth_router
from app.router.users_routes import router as users_router
from app.router.correlate_routes import router as correlate_router

routers = [
    (upload_router, "Upload"),
    (analyze_router, "Analyze"),
    (explore_router, "Explore"),
    (intelligence_router, "Intelligence"),
    (history_router, "History"),
    (auth_router, "Auth"),
    (users_router, "Users"),
    (correlate_router, "Correlation"),
]

for router, tag in routers:
    app.include_router(router, prefix="/api", tags=[tag])


# ============================================================
# 🩺 Healthcheck & Debug Endpoints
# ============================================================
@app.get("/api/health")
def health():
    return {"status": "ok", "message": "SmartDoc Backend is running 🚀"}


@app.get("/api/debug/config")
def debug_config():
    return {
        "supabase_url": settings.SUPABASE_URL,
        "api_base_url": settings.API_BASE_URL,
        "allowed_origins": settings.allowed_origins_list,
        "connected": True
    }


# ============================================================
# 🏠 Root Route
# ============================================================
@app.get("/")
def root():
    return {
        "app": "SmartDoc Enterprise",
        "version": "6.3",
        "message": "Backend running successfully ✅"
    }


# ============================================================
# 🧭 Route Inspector — Auto-prints all API routes on startup
# ============================================================
logger = logging.getLogger("uvicorn")

@app.on_event("startup")
async def print_registered_routes():
    logger.info("\n📋 ===== SMARTDOC ENTERPRISE ROUTE MAP =====")
    for route in app.routes:
        if isinstance(route, APIRoute):
            methods = ",".join(route.methods)
            path = route.path
            tags = getattr(route, "tags", [])
            tag_label = f"[{', '.join(tags)}]" if tags else ""
            logger.info(f"🔹 {methods:10s} {path:40s} {tag_label}")
    logger.info("============================================\n")
