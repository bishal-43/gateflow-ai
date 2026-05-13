"""schemas/auth.py — Auth request/response schemas"""
from pydantic import BaseModel, EmailStr, Field, field_validator
from schemas.common import MessageResponse  # noqa: F401 — re-exported for convenience


class RegisterRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    role: str = Field(default="ORGANIZER")

    @field_validator("role")
    @classmethod
    def valid_role(cls, v: str) -> str:
        allowed = {"ORGANIZER", "RESIDENT", "GUARD", "ADMIN"}
        upper = v.upper()
        if upper not in allowed:
            raise ValueError(f"role must be one of {sorted(allowed)}")
        return upper


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1)


class RefreshRequest(BaseModel):
    refresh_token: str


class LogoutRequest(BaseModel):
    refresh_token: str


class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    auth_provider: str
    avatar_url: str | None = None
    is_active: bool
    is_verified: bool
    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    role: str
    user: UserResponse


TokenResponse.model_rebuild()
