from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class TokenUser(BaseModel):
    id: int
    username: str
    email: str


class Token(BaseModel):
    access_token: str
    token_type: str
    user: TokenUser


class TokenData(BaseModel):
    id: Optional[int] = None
    email: Optional[str] = None


class TokenPayload(BaseModel):
    sub: str
    email: Optional[str] = None
    exp: Optional[datetime] = None