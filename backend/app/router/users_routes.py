from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.db import get_db
from app.models.user import User
from app.schemas.user import UserOut
from app.router.auth_routes import require_role

router = APIRouter(prefix="/api", tags=["users"])

@router.get("/users", response_model=List[UserOut])
def list_users(db: Session = Depends(get_db), user: User = Depends(require_role("admin"))):
    return db.query(User).all()
