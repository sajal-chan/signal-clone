from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.models.conversation import Conversation, ConversationMember
from app.models.message import Message, MessageReceipt, ReceiptStatus


async def create_message(
    db: AsyncSession,
    conversation_id: int,
    sender_id: int,
    content: str,
    reply_to_id: int | None = None,
) -> Message:
    msg = Message(
        conversation_id=conversation_id,
        sender_id=sender_id,
        content=content,
        reply_to_id=reply_to_id,
    )
    db.add(msg)

    conv = await db.get(Conversation, conversation_id)
    conv.last_message_at = datetime.utcnow()

    await db.flush()

    members_result = await db.execute(
        select(ConversationMember).where(
            ConversationMember.conversation_id == conversation_id,
            ConversationMember.user_id != sender_id,
        )
    )
    for member in members_result.scalars().all():
        db.add(MessageReceipt(
            message_id=msg.id,
            user_id=member.user_id,
            status=ReceiptStatus.sent,
        ))

    await db.commit()

    result = await db.execute(
        select(Message)
        .options(
            selectinload(Message.sender),
            selectinload(Message.reactions),
            selectinload(Message.reply_to).selectinload(Message.sender),
        )
        .where(Message.id == msg.id)
    )
    return result.scalar_one()


async def mark_message_read(
    db: AsyncSession,
    message_id: int,
    user_id: int,
) -> MessageReceipt | None:
    msg = await db.get(Message, message_id)
    if not msg:
        return None

    receipt_result = await db.execute(
        select(MessageReceipt).where(
            MessageReceipt.message_id == message_id,
            MessageReceipt.user_id == user_id,
        )
    )
    receipt = receipt_result.scalar_one_or_none()
    if receipt:
        receipt.status = ReceiptStatus.read
        receipt.updated_at = datetime.utcnow()

    member_result = await db.execute(
        select(ConversationMember).where(
            ConversationMember.conversation_id == msg.conversation_id,
            ConversationMember.user_id == user_id,
        )
    )
    member = member_result.scalar_one_or_none()
    if member and (not member.last_read_message_id or message_id > member.last_read_message_id):
        member.last_read_message_id = message_id

    await db.commit()
    return receipt
