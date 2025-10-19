from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
import os

DB_PATH = os.environ.get("DATABASE_URL", "sqlite:///../data/smartdoc.sqlite")
engine = create_engine(DB_PATH, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base = declarative_base()
