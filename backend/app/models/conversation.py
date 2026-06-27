from datetime import datetime
from enum import Enum as PyEnum
from sqlalchemy import ForeignKey, DateTime, String, Enum, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db import Base

class ConversationType(str, PyEnum):
    direct = "direct"
    group = "group"

class MemberRole(str, PyEnum):
    member = "member"
    admin = "admin"

class Conversation(Base):
    __tablename__ = "conversations"

    id: Mapped[int] = mapped_column(primary_key=True)
    type: Mapped[ConversationType] = mapped_column(Enum(ConversationType))
    name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    avatar_url: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_by: Mapped[int] = mapped_column(ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())
    last_message_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    members: Mapped[list["ConversationMember"]] = relationship(
        "ConversationMember", back_populates="conversation", cascade="all, delete-orphan"
    )
    messages: Mapped[list["Message"]] = relationship(
        "Message", back_populates="conversation", cascade="all, delete-orphan"
    )

class ConversationMember(Base):
    __tablename__ = "conversation_members"

    id: Mapped[int] = mapped_column(primary_key=True)
    conversation_id: Mapped[int] = mapped_column(ForeignKey("conversations.id"), index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    role: Mapped[MemberRole] = mapped_column(Enum(MemberRole), default=MemberRole.member)
    joined_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())
    last_read_message_id: Mapped[int | None] = mapped_column(
        ForeignKey("messages.id"), nullable=True
    )

    conversation: Mapped["Conversation"] = relationship(
        "Conversation", back_populates="members"
    )
    user: Mapped["User"] = relationship("User", back_populates="conversation_memberships")
