from pydantic import BaseModel
from app.schemas.user import UserPublic

class ContactCreate(BaseModel):
    contact_user_id: int
    nickname: str | None = None

class ContactOut(BaseModel):
    id: int
    contact_user: UserPublic
    nickname: str | None

    model_config = {"from_attributes": True}
