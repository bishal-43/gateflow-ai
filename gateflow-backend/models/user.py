"""models/user.py — User ORM model"""
import enum, uuid
from sqlalchemy import Boolean, Column, DateTime, Enum, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from database import Base


class UserRole(str, enum.Enum):
    ORGANIZER = "ORGANIZER"
    RESIDENT  = "RESIDENT"
    GUARD     = "GUARD"
    ADMIN     = "ADMIN"


class AuthProvider(str, enum.Enum):
    EMAIL  = "EMAIL"
    GOOGLE = "GOOGLE"


class User(Base):
    __tablename__ = "users"

    id              = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email           = Column(String, unique=True, nullable=False, index=True)
    full_name       = Column(String, nullable=False)
    hashed_password = Column(String, nullable=True)
    role            = Column(Enum(UserRole), nullable=False, default=UserRole.ORGANIZER)
    auth_provider   = Column(Enum(AuthProvider), nullable=False, default=AuthProvider.EMAIL)
    google_id       = Column(String, unique=True, nullable=True, index=True)
    avatar_url      = Column(String, nullable=True)
    is_active       = Column(Boolean, default=True, nullable=False)
    is_verified     = Column(Boolean, default=False, nullable=False)
    created_at      = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at      = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    def __repr__(self):
        return f"<User {self.email} role={self.role}>"
