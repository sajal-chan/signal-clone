from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from app.db import get_db
from app.models.user import User
from app.models.conversation import Conversation, ConversationMember, ConversationType, MemberRole
from app.models.message import Message
from app.schemas.conversation import (
    ConversationPreview, ConversationCreate, ConversationUpdate,
    AddMemberRequest, MessagePreview, MemberOut,
)
from app.dependencies import get_current_user

router = APIRouter(prefix="/api/conversations", tags=["conversations"])


async def _build_preview(conv: Conversation, current_user_id: int, db: AsyncSession) -> ConversationPreview:
    last_msg_result = await db.execute(
        select(Message)
        .where(Message.conversation_id == conv.id, Message.is_deleted == False)
        .order_by(Message.created_at.desc())
        .limit(1)
    )
    last_msg = last_msg_result.scalar_one_or_none()

    member = next((m for m in conv.members if m.user_id == current_user_id), None)
    unread_count = 0
    if member:
        query = select(func.count(Message.id)).where(
            Message.conversation_id == conv.id,
            Message.sender_id != current_user_id,
            Message.is_deleted == False,
        )
        if member.last_read_message_id:
            query = query.where(Message.id > member.last_read_message_id)
        result = await db.execute(query)
        unread_count = result.scalar_one()

    other_user = None
    if conv.type == ConversationType.direct:
        other_member = next((m for m in conv.members if m.user_id != current_user_id), None)
        if other_member:
            other_user = other_member.user

    return ConversationPreview(
        id=conv.id,
        type=conv.type,
        name=conv.name,
        avatar_url=conv.avatar_url,
        last_message_at=conv.last_message_at,
        last_message=MessagePreview.model_validate(last_msg) if last_msg else None,
        unread_count=unread_count,
        other_user=other_user,
        members=[MemberOut.model_validate(m) for m in conv.members],
    )


@router.get("", response_model=list[ConversationPreview])
async def list_conversations(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Conversation)
        .join(ConversationMember)
        .where(ConversationMember.user_id == current_user.id)
        .options(
            selectinload(Conversation.members).selectinload(ConversationMember.user)
        )
        .order_by(Conversation.last_message_at.desc().nullslast())
    )
    convs = result.scalars().unique().all()
    return [await _build_preview(c, current_user.id, db) for c in convs]


@router.post("", response_model=ConversationPreview, status_code=201)
async def create_conversation(
    body: ConversationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    conv_type = ConversationType(body.type)

    if conv_type == ConversationType.direct:
        if len(body.member_ids) != 1:
            raise HTTPException(status_code=400, detail="Direct conversations require exactly 1 other member")
        other_id = body.member_ids[0]
        existing = await db.execute(
            select(Conversation)
            .join(ConversationMember, Conversation.id == ConversationMember.conversation_id)
            .where(
                Conversation.type == ConversationType.direct,
                ConversationMember.user_id == current_user.id,
            )
            .options(selectinload(Conversation.members).selectinload(ConversationMember.user))
        )
        for conv in existing.scalars().unique().all():
            member_ids = {m.user_id for m in conv.members}
            if other_id in member_ids and len(member_ids) == 2:
                return await _build_preview(conv, current_user.id, db)

    conv = Conversation(type=conv_type, name=body.name, created_by=current_user.id)
    db.add(conv)
    await db.flush()

    all_member_ids = list({current_user.id} | set(body.member_ids))
    for uid in all_member_ids:
        role = MemberRole.admin if uid == current_user.id else MemberRole.member
        db.add(ConversationMember(conversation_id=conv.id, user_id=uid, role=role))

    await db.commit()
    result = await db.execute(
        select(Conversation)
        .where(Conversation.id == conv.id)
        .options(selectinload(Conversation.members).selectinload(ConversationMember.user))
    )
    conv = result.scalar_one()
    return await _build_preview(conv, current_user.id, db)


@router.get("/{conv_id}", response_model=ConversationPreview)
async def get_conversation(
    conv_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Conversation)
        .where(Conversation.id == conv_id)
        .options(selectinload(Conversation.members).selectinload(ConversationMember.user))
    )
    conv = result.scalar_one_or_none()
    if not conv or not any(m.user_id == current_user.id for m in conv.members):
        raise HTTPException(status_code=404, detail="Conversation not found")
    return await _build_preview(conv, current_user.id, db)


@router.patch("/{conv_id}", response_model=ConversationPreview)
async def update_conversation(
    conv_id: int,
    body: ConversationUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Conversation)
        .where(Conversation.id == conv_id)
        .options(selectinload(Conversation.members).selectinload(ConversationMember.user))
    )
    conv = result.scalar_one_or_none()
    if not conv or not any(m.user_id == current_user.id for m in conv.members):
        raise HTTPException(status_code=404, detail="Conversation not found")
    member = next((m for m in conv.members if m.user_id == current_user.id), None)
    if not member or member.role != MemberRole.admin:
        raise HTTPException(status_code=403, detail="Admin only")
    if body.name is not None:
        conv.name = body.name
    await db.commit()
    await db.refresh(conv)
    result = await db.execute(
        select(Conversation)
        .where(Conversation.id == conv_id)
        .options(selectinload(Conversation.members).selectinload(ConversationMember.user))
    )
    conv = result.scalar_one()
    return await _build_preview(conv, current_user.id, db)


@router.post("/{conv_id}/members", status_code=201)
async def add_member(
    conv_id: int,
    body: AddMemberRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Conversation)
        .where(Conversation.id == conv_id)
        .options(selectinload(Conversation.members))
    )
    conv = result.scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    caller_member = next((m for m in conv.members if m.user_id == current_user.id), None)
    if not caller_member or caller_member.role != MemberRole.admin:
        raise HTTPException(status_code=403, detail="Admin only")
    db.add(ConversationMember(conversation_id=conv_id, user_id=body.user_id))
    await db.commit()
    return {"message": "Member added"}


@router.delete("/{conv_id}/members/{user_id}", status_code=204)
async def remove_member(
    conv_id: int,
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Conversation)
        .where(Conversation.id == conv_id)
        .options(selectinload(Conversation.members))
    )
    conv = result.scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    caller = next((m for m in conv.members if m.user_id == current_user.id), None)
    if not caller or (caller.role != MemberRole.admin and user_id != current_user.id):
        raise HTTPException(status_code=403, detail="Forbidden")
    target = next((m for m in conv.members if m.user_id == user_id), None)
    if not target:
        raise HTTPException(status_code=404, detail="Member not found")
    await db.delete(target)
    await db.commit()
