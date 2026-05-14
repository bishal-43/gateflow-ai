"""models/walkin.py — WalkInRequest ORM model

A walk-in happens when a visitor arrives WITHOUT a pre-created invite.
The guard submits a request, and the organizer approves or rejects it.
On approval, a normal Invite row is automatically created.
"""
import enum
import uuid

from sqlalchemy import Column, DateTime, Enum, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from database import Base


class WalkInStatus(str, enum.Enum):
    PENDING  = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class WalkInRequest(Base):
    __tablename__ = "walkin_requests"

    id            = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    space_id      = Column(UUID(as_uuid=True), ForeignKey("spaces.id", ondelete="CASCADE"), nullable=False, index=True)
    requested_by  = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    # invite_id is set after approval — links to the created Invite
    invite_id     = Column(UUID(as_uuid=True), ForeignKey("invites.id", ondelete="SET NULL"), nullable=True)

    visitor_name  = Column(String(200), nullable=False)
    visitor_phone = Column(String(20),  nullable=True)
    reason        = Column(String(500), nullable=True)
    proof_image   = Column(String(500), nullable=True)   # file path, set if guard uploads a photo

    status        = Column(Enum(WalkInStatus), nullable=False, default=WalkInStatus.PENDING, index=True)
    rejected_note = Column(String(500), nullable=True)   # organizer can leave a reason for rejection

    created_at    = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at    = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    space         = relationship("Space",  foreign_keys=[space_id],     lazy="noload")
    guard         = relationship("User",   foreign_keys=[requested_by], lazy="noload")
    invite        = relationship("Invite", foreign_keys=[invite_id],    lazy="noload")

    def __repr__(self):
        return f"<WalkInRequest {self.visitor_name!r} status={self.status}>"
