from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware
from app.config import settings
import json
import numpy as np
import socket
from fastapi.responses import JSONResponse

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
    version="6.2",
    description="Backend API powering SmartDoc data intelligence suite.",
    default_response_class=SafeJSONResponse  # ✅ Global NaN-safe responses
)


# ============================================================
# 🌐 Dynamic CORS Configuration (Safe for Local + Production)
# ============================================================
origins = set(settings.allowed_origins_list)

# 🧠 Auto-detect local development hosts
if any("localhost" in o or "127.0.0.1" in o for o in origins):
    local_ips = {"http://localhost:5174", "http://127.0.0.1:5174"}
    try:
        # Add your LAN IP for same-network device testing
        ip = socket.gethostbyname(socket.gethostname())
        local_ips.add(f"http://{ip}:5174")
    except Exception:
        pass
    origins |= local_ips  # merge with existing list

# ✅ Register CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=list(origins),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 🧩 Log environment details
print("🚀 Active CORS Origins:", list(origins))
print("🧩 API Base URL:", settings.API_BASE_URL)
print("🌐 Environment variables loaded successfully ✅")


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
# 🔌 Import & Register All Routers
# ============================================================
from app.router.upload import router as upload_router
from app.router.detect import router as detect_router
from app.router.analyze_router import router as analyze_router
from app.router.explore_routes import router as explore_router
from app.router.intelligence import router as intelligence_router
from app.router.history import router as history_router
from app.router.auth_routes import router as auth_router
from app.router.users_routes import router as users_router
from app.router.correlate_routes import router as correlate_router

app.include_router(upload_router, prefix="/api", tags=["Upload"])
app.include_router(detect_router, prefix="/api", tags=["Detect"])
app.include_router(analyze_router, prefix="/api", tags=["Analyze"])
app.include_router(explore_router, prefix="/api", tags=["Explore"])
app.include_router(intelligence_router, prefix="/api", tags=["Intelligence"])
app.include_router(history_router, prefix="/api", tags=["History"])
app.include_router(auth_router, prefix="/api", tags=["Auth"])
app.include_router(users_router, prefix="/api", tags=["Users"])
app.include_router(correlate_router, prefix="/api", tags=["Correlation"])


# ============================================================
# 🏠 Root Route
# ============================================================
@app.get("/")
def root():
    return {
        "app": "SmartDoc Enterprise",
        "version": "6.2",
        "message": "Backend running successfully ✅"
    }
