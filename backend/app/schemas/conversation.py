from pydantic import BaseModel
from datetime import datetime
from app.schemas.user import UserPublic

class MessagePreview(BaseModel):
    id: int
    content: str
    sender_id: int
    created_at: datetime
    model_config = {"from_attributes": True}

class MemberOut(BaseModel):
    id: int
    user: UserPublic
    role: str
    joined_at: datetime
    model_config = {"from_attributes": True}

class ConversationPreview(BaseModel):
    id: int
    type: str
    name: str | None
    avatar_url: str | None
    last_message_at: datetime | None
    last_message: MessagePreview | None
    unread_count: int
    other_user: UserPublic | None  # populated for DMs
    members: list[MemberOut]
    model_config = {"from_attributes": True}

class ConversationCreate(BaseModel):
    type: str  # "direct" | "group"
    member_ids: list[int]
    name: str | None = None

class ConversationUpdate(BaseModel):
    name: str | None = None

class AddMemberRequest(BaseModel):
    user_id: int
