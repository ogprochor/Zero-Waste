from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from ZeroWaste.app.schemas.user import User

class ConversationUser(BaseModel):
    id: int
    username: str
    email: str
    avatar_url: Optional[str]

    class Config:
        from_attributes = True


class ConversationResponse(BaseModel):
    id: int
    other_user: User
    last_message: str | None
    last_message_time: datetime | None
    unread_count: int

    class Config:
        from_attributes = True