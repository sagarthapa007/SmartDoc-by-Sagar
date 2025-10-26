from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.db import get_db
from app.models.user import User
from app.schemas.user import UserOut
from app.router.auth_routes import require_role

# ✅ Single Router Declaration
router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/")
def get_users():
    ...
