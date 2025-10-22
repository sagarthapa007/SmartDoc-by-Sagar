# ================================================================
# 📦 DATABASE INITIALIZATION — SmartDoc G5
# ================================================================
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# ----------------------------------------------------------------
# DATABASE CONFIGURATION
# ----------------------------------------------------------------
# Using SQLite for development — change to PostgreSQL/MySQL later
SQLALCHEMY_DATABASE_URL = "sqlite:///./smartdoc.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False}  # Needed only for SQLite
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# ----------------------------------------------------------------
# DATABASE SESSION DEPENDENCY (used by FastAPI Depends)
# ----------------------------------------------------------------
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
