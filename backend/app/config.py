from pydantic import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "SmartDoc Backend"
    DEBUG: bool = True
    SECRET_KEY: str = "super-secret-key"   # 🔒 Replace for production
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24
    DATABASE_URL: str = "sqlite:///./smartdoc.db"  # default local DB

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
