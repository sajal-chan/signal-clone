from pydantic import BaseModel
from datetime import datetime

class UserPublic(BaseModel):
    id: int
    username: str
    display_name: str
    avatar_url: str | None
    status_message: str | None
    is_online: bool
    last_seen: datetime

    model_config = {"from_attributes": True}

class UserPrivate(UserPublic):
    phone_number: str | None
    created_at: datetime
