from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import Optional
from app.db import get_db, Base, engine
from app.models.user import User
from app.schemas.user import UserCreate, UserLogin, UserOut, TokenOut
from app.utils.security import hash_password, verify_password, create_access_token, decode_token

security = HTTPBearer()
router = APIRouter(prefix="/api/auth", tags=["auth"])

# Create tables
Base.metadata.create_all(bind=engine)

def get_current_user(token: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)) -> User:
    payload = decode_token(token.credentials)
    if not payload or "sub" not in payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    user: Optional[User] = db.query(User).filter(User.id == int(payload["sub"])).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User disabled or not found")
    return user

def require_role(required: str):
    def _checker(user: User = Depends(get_current_user)):
        allowed = {"viewer": 1, "analyst": 2, "admin": 3}
        if allowed.get(user.role, 0) < allowed.get(required, 0):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient role")
        return user
    return _checker

@router.post("/register", response_model=UserOut)
def register(payload: UserCreate, db: Session = Depends(get_db)):
    exists = db.query(User).filter(User.email == payload.email.lower()).first()
    if exists:
        raise HTTPException(status_code=400, detail="Email already registered")
    u = User(
        email=payload.email.lower(),
        name=payload.name,
        hashed_password=hash_password(payload.password),
        role=payload.role or "viewer",
    )
    db.add(u)
    db.commit()
    db.refresh(u)
    return u

@router.post("/login", response_model=TokenOut)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    u = db.query(User).filter(User.email == payload.email.lower()).first()
    if not u or not verify_password(payload.password, u.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token({"sub": str(u.id), "role": u.role})
    return {"access_token": token, "token_type": "bearer"}

@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return user
