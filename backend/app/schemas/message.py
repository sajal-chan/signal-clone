from pydantic import BaseModel
from datetime import datetime
from app.schemas.user import UserPublic

class ReactionOut(BaseModel):
    id: int
    user_id: int
    emoji: str
    model_config = {"from_attributes": True}

class MessageOut(BaseModel):
    id: int
    conversation_id: int
    sender_id: int
    sender: UserPublic
    content: str
    type: str
    reply_to_id: int | None
    reply_to: "MessageOut | None"
    created_at: datetime
    edited_at: datetime | None
    is_deleted: bool
    reactions: list[ReactionOut]
    model_config = {"from_attributes": True}

class MessageCreate(BaseModel):
    content: str
    reply_to_id: int | None = None
