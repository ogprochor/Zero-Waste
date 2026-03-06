from passlib.context import CryptContext
import bcrypt
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional

from .config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)


# Funkcje hashowania
def hash_password(password: str) -> str:
    password_bytes = password.encode('utf-8')
    if len(password_bytes) > 72:
        password_bytes = password_bytes[:72]

    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    password_bytes = plain_password.encode('utf-8')
    if len(password_bytes) > 72:
        password_bytes = password_bytes[:72]

    return bcrypt.checkpw(password_bytes, hashed_password.encode('utf-8'))


# Funkcje JWT
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()

    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({"exp": expire})

    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def verify_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None


def get_user_id_from_token(token: str) -> Optional[int]:
    payload = verify_token(token)
    if payload and "sub" in payload:
        try:
            return int(payload["sub"])
        except (ValueError, TypeError):
            return None
    return None