import json
from datetime import datetime
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from jose import JWTError
from app.db import AsyncSessionLocal
from app.services.auth_service import decode_token
from app.services.message_service import create_message, mark_message_read
from app.models.user import User
from app.models.conversation import Conversation, ConversationMember
from app.models.message import Message, MessageReaction

router = APIRouter()


class ConnectionManager:
    def __init__(self):
        self._connections: dict[int, WebSocket] = {}

    async def connect(self, user_id: int, ws: WebSocket):
        await ws.accept()
        self._connections[user_id] = ws

    def disconnect(self, user_id: int):
        self._connections.pop(user_id, None)

    def is_online(self, user_id: int) -> bool:
        return user_id in self._connections

    async def send_to_user(self, user_id: int, data: dict):
        ws = self._connections.get(user_id)
        if ws:
            try:
                await ws.send_json(data)
            except Exception:
                self.disconnect(user_id)

    async def send_to_users(self, user_ids: list[int], data: dict):
        for uid in user_ids:
            await self.send_to_user(uid, data)


manager = ConnectionManager()


async def _get_conversation_member_ids(db: AsyncSession, conversation_id: int) -> list[int]:
    result = await db.execute(
        select(ConversationMember.user_id).where(
            ConversationMember.conversation_id == conversation_id
        )
    )
    return list(result.scalars().all())


async def _get_contact_ids(db: AsyncSession, user_id: int) -> list[int]:
    from app.models.contact import Contact
    result = await db.execute(
        select(Contact.contact_user_id).where(Contact.owner_id == user_id)
    )
    return list(result.scalars().all())


def _serialize_message(msg: Message) -> dict:
    return {
        "id": msg.id,
        "conversation_id": msg.conversation_id,
        "sender_id": msg.sender_id,
        "sender": {
            "id": msg.sender.id,
            "username": msg.sender.username,
            "display_name": msg.sender.display_name,
            "avatar_url": msg.sender.avatar_url,
            "is_online": msg.sender.is_online,
            "last_seen": msg.sender.last_seen.isoformat(),
            "status_message": msg.sender.status_message,
        },
        "content": msg.content,
        "type": msg.type,
        "reply_to_id": msg.reply_to_id,
        "reply_to": {
            "id": msg.reply_to.id,
            "content": msg.reply_to.content,
            "sender_id": msg.reply_to.sender_id,
            "sender": {
                "id": msg.reply_to.sender.id,
                "display_name": msg.reply_to.sender.display_name,
            },
        } if msg.reply_to else None,
        "created_at": msg.created_at.isoformat(),
        "edited_at": msg.edited_at.isoformat() if msg.edited_at else None,
        "is_deleted": msg.is_deleted,
        "reactions": [
            {"id": r.id, "user_id": r.user_id, "emoji": r.emoji}
            for r in msg.reactions
        ],
    }


@router.websocket("/ws")
async def websocket_endpoint(ws: WebSocket, token: str = Query(...)):
    try:
        payload = decode_token(token)
        user_id = int(payload.get("sub"))
    except (JWTError, TypeError, ValueError):
        await ws.close(code=4001)
        return

    async with AsyncSessionLocal() as db:
        user = await db.get(User, user_id)
        if not user:
            await ws.close(code=4001)
            return

        await manager.connect(user_id, ws)

        user.is_online = True
        await db.commit()

        contact_ids = await _get_contact_ids(db, user_id)
        await manager.send_to_users(contact_ids, {
            "type": "presence:update",
            "user_id": user_id,
            "is_online": True,
            "last_seen": datetime.utcnow().isoformat(),
        })

        try:
            while True:
                raw = await ws.receive_text()
                try:
                    event = json.loads(raw)
                except json.JSONDecodeError:
                    continue

                etype = event.get("type")

                if etype == "message:send":
                    conv_id = event.get("conversation_id")
                    content = event.get("content", "").strip()
                    reply_to_id = event.get("reply_to_id")
                    if not conv_id or not content:
                        continue
                    msg = await create_message(db, conv_id, user_id, content, reply_to_id)
                    member_ids = await _get_conversation_member_ids(db, conv_id)
                    await manager.send_to_users(member_ids, {
                        "type": "message:new",
                        "message": _serialize_message(msg),
                    })

                elif etype == "typing:start" or etype == "typing:stop":
                    conv_id = event.get("conversation_id")
                    if not conv_id:
                        continue
                    member_ids = await _get_conversation_member_ids(db, conv_id)
                    other_ids = [uid for uid in member_ids if uid != user_id]
                    await manager.send_to_users(other_ids, {
                        "type": "typing:update",
                        "conversation_id": conv_id,
                        "user_id": user_id,
                        "is_typing": etype == "typing:start",
                    })

                elif etype == "message:read":
                    message_id = event.get("message_id")
                    if not message_id:
                        continue
                    await mark_message_read(db, message_id, user_id)
                    msg = await db.get(Message, message_id)
                    if msg and msg.sender_id != user_id:
                        await manager.send_to_user(msg.sender_id, {
                            "type": "message:status",
                            "message_id": message_id,
                            "user_id": user_id,
                            "status": "read",
                        })

                elif etype == "reaction:add":
                    message_id = event.get("message_id")
                    emoji = event.get("emoji", "").strip()
                    if not message_id or not emoji:
                        continue
                    existing = await db.execute(
                        select(MessageReaction).where(
                            MessageReaction.message_id == message_id,
                            MessageReaction.user_id == user_id,
                            MessageReaction.emoji == emoji,
                        )
                    )
                    if not existing.scalar_one_or_none():
                        db.add(MessageReaction(message_id=message_id, user_id=user_id, emoji=emoji))
                        await db.commit()
                    msg_result = await db.execute(
                        select(Message).options(selectinload(Message.reactions)).where(Message.id == message_id)
                    )
                    msg = msg_result.scalar_one_or_none()
                    if msg:
                        conv_members = await _get_conversation_member_ids(db, msg.conversation_id)
                        await manager.send_to_users(conv_members, {
                            "type": "reaction:update",
                            "message_id": message_id,
                            "reactions": [{"id": r.id, "user_id": r.user_id, "emoji": r.emoji} for r in msg.reactions],
                        })

                elif etype == "reaction:remove":
                    message_id = event.get("message_id")
                    emoji = event.get("emoji", "").strip()
                    if not message_id or not emoji:
                        continue
                    existing = await db.execute(
                        select(MessageReaction).where(
                            MessageReaction.message_id == message_id,
                            MessageReaction.user_id == user_id,
                            MessageReaction.emoji == emoji,
                        )
                    )
                    reaction = existing.scalar_one_or_none()
                    if reaction:
                        await db.delete(reaction)
                        await db.commit()
                    msg_result = await db.execute(
                        select(Message).options(selectinload(Message.reactions)).where(Message.id == message_id)
                    )
                    msg = msg_result.scalar_one_or_none()
                    if msg:
                        conv_members = await _get_conversation_member_ids(db, msg.conversation_id)
                        await manager.send_to_users(conv_members, {
                            "type": "reaction:update",
                            "message_id": message_id,
                            "reactions": [{"id": r.id, "user_id": r.user_id, "emoji": r.emoji} for r in msg.reactions],
                        })

        except WebSocketDisconnect:
            pass
        finally:
            manager.disconnect(user_id)
            user = await db.get(User, user_id)
            if user:
                user.is_online = False
                user.last_seen = datetime.utcnow()
                await db.commit()
            contact_ids = await _get_contact_ids(db, user_id)
            await manager.send_to_users(contact_ids, {
                "type": "presence:update",
                "user_id": user_id,
                "is_online": False,
                "last_seen": datetime.utcnow().isoformat(),
            })
