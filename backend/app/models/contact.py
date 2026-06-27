from datetime import datetime
from sqlalchemy import ForeignKey, DateTime, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db import Base

class Contact(Base):
    __tablename__ = "contacts"
    __table_args__ = (UniqueConstraint("owner_id", "contact_user_id"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    contact_user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    nickname: Mapped[str | None] = mapped_column(String(100), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())

    owner: Mapped["User"] = relationship("User", foreign_keys=[owner_id])
    contact_user: Mapped["User"] = relationship("User", foreign_keys=[contact_user_id])
