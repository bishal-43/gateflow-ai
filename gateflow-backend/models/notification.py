"""models/notification.py — Notification ORM model"""
import enum
import uuid

from sqlalchemy import Boolean, Column, DateTime, Enum, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from database import Base


class NotificationType(str, enum.Enum):
    WALKIN_REQUEST  = "WALKIN_REQUEST"
    OVERSTAY_ALERT  = "OVERSTAY_ALERT"
    QR_REJECTED     = "QR_REJECTED"
    EVENT_REMINDER  = "EVENT_REMINDER"


class Notification(Base):
    __tablename__ = "notifications"

    id          = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id     = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    space_id    = Column(UUID(as_uuid=True), ForeignKey("spaces.id", ondelete="CASCADE"), nullable=True, index=True)
    type        = Column(Enum(NotificationType), nullable=False, index=True)
    title       = Column(String(200), nullable=False)
    message     = Column(Text, nullable=False)
    is_read     = Column(Boolean, default=False, nullable=False, index=True)
    created_at  = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    user  = relationship("User",  foreign_keys=[user_id],  lazy="noload")
    space = relationship("Space", foreign_keys=[space_id], lazy="noload")

    def __repr__(self):
        return f"<Notification type={self.type} user={self.user_id} read={self.is_read}>"
