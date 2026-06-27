from datetime import datetime
from enum import Enum as PyEnum
from sqlalchemy import ForeignKey, DateTime, String, Text, Boolean, Enum, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db import Base

class MessageType(str, PyEnum):
    text = "text"
    image = "image"
    file = "file"
    system = "system"

class ReceiptStatus(str, PyEnum):
    sent = "sent"
    delivered = "delivered"
    read = "read"

class Message(Base):
    __tablename__ = "messages"

    id: Mapped[int] = mapped_column(primary_key=True)
    conversation_id: Mapped[int] = mapped_column(ForeignKey("conversations.id"), index=True)
    sender_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    content: Mapped[str] = mapped_column(Text)
    type: Mapped[MessageType] = mapped_column(Enum(MessageType), default=MessageType.text)
    reply_to_id: Mapped[int | None] = mapped_column(ForeignKey("messages.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())
    edited_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False)

    sender: Mapped["User"] = relationship(
        "User", back_populates="sent_messages", foreign_keys=[sender_id]
    )
    conversation: Mapped["Conversation"] = relationship(
        "Conversation", back_populates="messages"
    )
    reply_to: Mapped["Message | None"] = relationship(
        "Message", remote_side="Message.id", foreign_keys=[reply_to_id]
    )
    receipts: Mapped[list["MessageReceipt"]] = relationship(
        "MessageReceipt", back_populates="message", cascade="all, delete-orphan"
    )
    reactions: Mapped[list["MessageReaction"]] = relationship(
        "MessageReaction", back_populates="message", cascade="all, delete-orphan"
    )

class MessageReceipt(Base):
    __tablename__ = "message_receipts"

    id: Mapped[int] = mapped_column(primary_key=True)
    message_id: Mapped[int] = mapped_column(ForeignKey("messages.id"), index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    status: Mapped[ReceiptStatus] = mapped_column(
        Enum(ReceiptStatus), default=ReceiptStatus.sent
    )
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())

    message: Mapped["Message"] = relationship("Message", back_populates="receipts")

class MessageReaction(Base):
    __tablename__ = "message_reactions"

    id: Mapped[int] = mapped_column(primary_key=True)
    message_id: Mapped[int] = mapped_column(ForeignKey("messages.id"), index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    emoji: Mapped[str] = mapped_column(String(10))

    message: Mapped["Message"] = relationship("Message", back_populates="reactions")
