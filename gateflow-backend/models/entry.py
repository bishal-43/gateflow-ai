"""models/entry.py — EntrySession ORM model"""
import enum, uuid
from sqlalchemy import Column, DateTime, Enum, ForeignKey, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class EntryStatus(str, enum.Enum):
    INSIDE         = "INSIDE"
    EXITED         = "EXITED"
    ASSUMED_EXITED = "ASSUMED_EXITED"
    OVERSTAYED     = "OVERSTAYED"


class EntrySession(Base):
    __tablename__ = "entry_sessions"
    __table_args__ = (
        UniqueConstraint("invite_id", name="uq_entry_sessions_invite_id"),
    )

    id            = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    invite_id     = Column(UUID(as_uuid=True), ForeignKey("invites.id", ondelete="CASCADE"), nullable=False, index=True, unique=True)
    space_id      = Column(UUID(as_uuid=True), ForeignKey("spaces.id", ondelete="CASCADE"), nullable=False, index=True)
    scanned_by    = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    visitor_name  = Column(String(200), nullable=False)
    gate_id       = Column(String(100), nullable=True)
    entry_time    = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    exit_time     = Column(DateTime(timezone=True), nullable=True)
    allowed_until = Column(DateTime(timezone=True), nullable=True)
    status        = Column(Enum(EntryStatus), nullable=False, default=EntryStatus.INSIDE, index=True)
    created_at    = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    invite = relationship("Invite", foreign_keys=[invite_id], lazy="noload")
    space  = relationship("Space",  foreign_keys=[space_id],  lazy="noload")
    guard  = relationship("User",   foreign_keys=[scanned_by], lazy="noload")

    def __repr__(self):
        return f"<EntrySession {self.visitor_name!r} status={self.status}>"
