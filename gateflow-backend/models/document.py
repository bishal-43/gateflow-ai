"""models/document.py — Document ORM model (PDF metadata only)"""
import uuid

from sqlalchemy import BigInteger, Column, DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from database import Base


class Document(Base):
    __tablename__ = "documents"

    id          = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    space_id    = Column(UUID(as_uuid=True), ForeignKey("spaces.id", ondelete="CASCADE"), nullable=False, index=True)
    uploaded_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    filename    = Column(String(300), nullable=False)       # original file name
    file_path   = Column(String(500), nullable=False)       # path on disk
    file_size   = Column(BigInteger, nullable=False)        # bytes
    created_at  = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    space    = relationship("Space", foreign_keys=[space_id],    lazy="noload")
    uploader = relationship("User",  foreign_keys=[uploaded_by], lazy="noload")

    def __repr__(self):
        return f"<Document {self.filename!r} space={self.space_id}>"
