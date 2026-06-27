from datetime import datetime
from sqlalchemy import String, Boolean, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db import Base

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    phone_number: Mapped[str | None] = mapped_column(String(20), unique=True, nullable=True)
    display_name: Mapped[str] = mapped_column(String(100))
    avatar_url: Mapped[str | None] = mapped_column(String(255), nullable=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    status_message: Mapped[str | None] = mapped_column(String(255), nullable=True)
    last_seen: Mapped[datetime] = mapped_column(DateTime, default=func.now())
    is_online: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())

    sent_messages: Mapped[list["Message"]] = relationship(
        "Message", back_populates="sender", foreign_keys="Message.sender_id"
    )
    conversation_memberships: Mapped[list["ConversationMember"]] = relationship(
        "ConversationMember", back_populates="user"
    )
