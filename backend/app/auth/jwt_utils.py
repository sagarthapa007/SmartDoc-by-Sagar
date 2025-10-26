import datetime

import jwt
from passlib.context import CryptContext

SECRET_KEY = "SMARTDOC_SUPER_SECRET"
ALGORITHM = "HS256"
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def create_access_token(data: dict, expires_minutes=60):
    to_encode = data.copy()
    to_encode["exp"] = datetime.datetime.utcnow() + datetime.timedelta(minutes=expires_minutes)
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def verify_password(plain, hashed):
    return pwd_context.verify(plain, hashed)


def hash_password(p):
    return pwd_context.hash(p)
