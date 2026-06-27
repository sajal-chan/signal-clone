from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.db import get_db
from app.models.user import User
from app.models.conversation import ConversationMember
from app.models.message import Message
from app.schemas.message import MessageOut, MessageCreate
from app.dependencies import get_current_user
from app.services.message_service import create_message, mark_message_read

router = APIRouter(tags=["messages"])


def _load_options():
    return [
        selectinload(Message.sender),
        selectinload(Message.reactions),
        selectinload(Message.reply_to).selectinload(Message.sender),
    ]


async def _assert_member(conv_id: int, user_id: int, db: AsyncSession):
    result = await db.execute(
        select(ConversationMember).where(
            ConversationMember.conversation_id == conv_id,
            ConversationMember.user_id == user_id,
        )
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=403, detail="Not a member")


@router.get("/api/conversations/{conv_id}/messages", response_model=list[MessageOut])
async def list_messages(
    conv_id: int,
    before: int | None = Query(default=None),
    limit: int = Query(default=50, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await _assert_member(conv_id, current_user.id, db)
    query = (
        select(Message)
        .options(*_load_options())
        .where(Message.conversation_id == conv_id, Message.is_deleted == False)
        .order_by(Message.created_at.desc())
        .limit(limit)
    )
    if before:
        ref = await db.get(Message, before)
        if ref:
            query = query.where(Message.created_at < ref.created_at)
    result = await db.execute(query)
    msgs = result.scalars().unique().all()
    return list(reversed(msgs))


@router.post("/api/conversations/{conv_id}/messages", response_model=MessageOut, status_code=201)
async def send_message(
    conv_id: int,
    body: MessageCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await _assert_member(conv_id, current_user.id, db)
    msg = await create_message(db, conv_id, current_user.id, body.content, body.reply_to_id)
    return msg


@router.patch("/api/messages/{message_id}/read", status_code=200)
async def mark_read(
    message_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await mark_message_read(db, message_id, current_user.id)
    if result is None:
        raise HTTPException(status_code=404, detail="Message not found")
    return {"message": "Marked as read"}
