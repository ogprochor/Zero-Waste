from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class PostCreate(BaseModel):
    content: str
    image_url: Optional[str] = None


class PostOut(BaseModel):
    id: int
    content: str
    image_url: Optional[str]
    created_at: datetime
    user_id: int

    class Config:
        from_attributes = True

class PostLikeOut(BaseModel):
    id: int
    user_id: int
    post_id: int
    created_at: datetime

    class Config:
        from_attributes = True