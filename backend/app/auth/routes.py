from app.db.base import Base, SessionLocal, engine
from app.db.user_model import User
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from .jwt_utils import create_access_token, hash_password, verify_password

Base.metadata.create_all(bind=engine)

router = APIRouter(prefix="/auth", tags=["auth"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/register")
def register(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    if db.query(User).filter(User.username == form_data.username).first():
        raise HTTPException(400, "User already exists")
    new_user = User(username=form_data.username, password_hash=hash_password(form_data.password))
    db.add(new_user)
    db.commit()
    return {"message": "User registered"}


@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(401, "Invalid credentials")
    token = create_access_token({"sub": user.username})
    return {"access_token": token, "token_type": "bearer"}
