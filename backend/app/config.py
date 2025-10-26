from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
import os


class Settings(BaseSettings):
    # 🌍 App URLs
    API_BASE_URL: str = "http://127.0.0.1:8000"
    FRONTEND_URL: str = "http://localhost:5174"

    # 🔐 Supabase / DB / Security
    SUPABASE_URL: str = ""
    SUPABASE_ANON_KEY: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""
    DATABASE_URL: str = ""
    JWT_SECRET_KEY: str = ""
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # 🌐 CORS
    ALLOWED_ORIGINS: str = "http://localhost:5174,http://127.0.0.1:5174"
    ENVIRONMENT: str = "development"

    # ✅ Allow extra env vars safely
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="allow",  # Prevents validation errors on unknown keys
    )

    # 🧠 Derived property (returns list for FastAPI CORS)
    @property
    def allowed_origins_list(self) -> List[str]:
        """
        Parses ALLOWED_ORIGINS into a clean list for FastAPI.
        Includes safety fallback for local/dev environments.
        """
        # 1️⃣ Split the provided comma-separated origins
        origins = [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]

        # 2️⃣ Add fallback for local development if empty or "*" found
        if not origins or self.ALLOWED_ORIGINS.strip() == "*":
            if self.ENVIRONMENT.lower() in {"development", "local"}:
                print("⚠️  Using permissive CORS for development.")
                return ["*"]
            else:
                print("🚫  No ALLOWED_ORIGINS set — restricting all external access.")
                return []

        return origins


# ✅ Instantiate settings globally
settings = Settings()

# 🧩 Debug info
print("🔧 Loaded ENVIRONMENT:", settings.ENVIRONMENT)
print("🌐 Allowed Origins List:", settings.allowed_origins_list)
