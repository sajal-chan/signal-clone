from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from app.db import get_db
from app.models.user import User
from app.schemas.user import UserPublic, UserPrivate
from app.dependencies import get_current_user

router = APIRouter(prefix="/api/users", tags=["users"])

class UserUpdate(BaseModel):
    display_name: str | None = None
    status_message: str | None = None

@router.get("/search", response_model=list[UserPublic])
async def search_users(
    q: str = Query(min_length=1),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(User).where(
            or_(User.username.ilike(f"%{q}%"), User.display_name.ilike(f"%{q}%")),
            User.id != current_user.id,
        ).limit(20)
    )
    return result.scalars().all()

@router.patch("/me", response_model=UserPrivate)
async def update_me(
    body: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if body.display_name is not None:
        current_user.display_name = body.display_name
    if body.status_message is not None:
        current_user.status_message = body.status_message
    await db.commit()
    await db.refresh(current_user)
    return current_user
