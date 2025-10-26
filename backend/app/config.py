from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List

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

    # ✅ Allow extra env vars safely
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="allow"  # <-- this line prevents pydantic ValidationError
    )

    # 🧠 Derived property (returns list for FastAPI CORS)
    @property
    def allowed_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]

# ✅ Instantiate settings globally
settings = Settings()
