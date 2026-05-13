"""models/space.py — Space ORM model"""
import enum, uuid
from sqlalchemy import Boolean, Column, DateTime, Enum, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class SpaceType(str, enum.Enum):
    EVENT     = "EVENT"
    APARTMENT = "APARTMENT"


class Space(Base):
    __tablename__ = "spaces"

    id             = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    owner_id       = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    type           = Column(Enum(SpaceType), nullable=False)
    name           = Column(String(200), nullable=False)
    venue          = Column(String(300), nullable=True)
    start_time     = Column(DateTime(timezone=True), nullable=True)
    end_time       = Column(DateTime(timezone=True), nullable=True)
    address        = Column(String(400), nullable=True)
    walkin_enabled = Column(Boolean, default=True, nullable=False)
    max_guests     = Column(Integer, nullable=True)
    is_active      = Column(Boolean, default=True, nullable=False, index=True)
    created_at     = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at     = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    owner = relationship("User", foreign_keys=[owner_id], lazy="noload")

    def __repr__(self):
        return f"<Space {self.name!r} type={self.type}>"
