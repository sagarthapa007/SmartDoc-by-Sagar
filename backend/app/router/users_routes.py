from typing import List

from app.db import get_db
from app.models.user import User
from app.router.auth_routes import require_role
from app.schemas.user import UserOut
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

# ✅ Single Router Declaration
router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/")
def get_users(): ...
