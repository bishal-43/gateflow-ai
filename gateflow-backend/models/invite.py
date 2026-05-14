"""models/invite.py — Invite ORM model"""
import enum, uuid
from sqlalchemy import Column, DateTime, Enum, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class InviteType(str, enum.Enum):
    EVENT_GUEST       = "EVENT_GUEST"
    APARTMENT_VISITOR = "APARTMENT_VISITOR"
    VENDOR            = "VENDOR"
    SERVICE           = "SERVICE"
    WALKIN            = "WALKIN"   # created automatically when a walk-in request is approved


class InviteStatus(str, enum.Enum):
    ACTIVE  = "ACTIVE"
    USED    = "USED"
    EXPIRED = "EXPIRED"
    REVOKED = "REVOKED"


class Invite(Base):
    __tablename__ = "invites"

    id            = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    space_id      = Column(UUID(as_uuid=True), ForeignKey("spaces.id", ondelete="CASCADE"), nullable=False, index=True)
    created_by    = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    visitor_name  = Column(String(200), nullable=False)
    visitor_email = Column(String(320), nullable=True)
    visitor_phone = Column(String(20), nullable=True)
    invite_type   = Column(Enum(InviteType), nullable=False)
    invite_token  = Column(String, unique=True, nullable=False, index=True)
    qr_token      = Column(String(64), unique=True, nullable=False, index=True)
    valid_from    = Column(DateTime(timezone=True), nullable=False)
    valid_until   = Column(DateTime(timezone=True), nullable=False)
    status        = Column(Enum(InviteStatus), nullable=False, default=InviteStatus.ACTIVE, index=True)
    created_at    = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at    = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    space          = relationship("Space", foreign_keys=[space_id], lazy="noload")
    created_by_user = relationship("User", foreign_keys=[created_by], lazy="noload")

    def __repr__(self):
        return f"<Invite {self.visitor_name!r} status={self.status}>"
