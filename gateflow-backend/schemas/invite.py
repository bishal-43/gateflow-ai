"""schemas/invite.py — Invite request/response schemas"""
from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator
from models.invite import InviteStatus, InviteType


class CreateInviteRequest(BaseModel):
    space_id: UUID
    visitor_name: str = Field(..., min_length=1, max_length=200)
    invite_type: InviteType
    valid_from: datetime
    valid_until: datetime
    visitor_email: Optional[EmailStr] = None
    visitor_phone: Optional[str] = Field(None, max_length=20)

    @field_validator("visitor_name")
    @classmethod
    def not_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("visitor_name cannot be blank")
        return v.strip()

    @model_validator(mode="after")
    def check_dates(self) -> "CreateInviteRequest":
        if self.valid_until <= self.valid_from:
            raise ValueError("valid_until must be after valid_from")
        return self


class UpdateInviteRequest(BaseModel):
    visitor_name: Optional[str] = Field(None, min_length=1, max_length=200)
    visitor_email: Optional[EmailStr] = None
    visitor_phone: Optional[str] = Field(None, max_length=20)
    valid_from: Optional[datetime] = None
    valid_until: Optional[datetime] = None

    @model_validator(mode="after")
    def check_dates(self) -> "UpdateInviteRequest":
        if self.valid_from and self.valid_until and self.valid_until <= self.valid_from:
            raise ValueError("valid_until must be after valid_from")
        return self


class InviteResponse(BaseModel):
    id: UUID
    space_id: UUID
    created_by: UUID
    visitor_name: str
    visitor_email: Optional[str] = None
    visitor_phone: Optional[str] = None
    invite_type: InviteType
    invite_link: str
    status: InviteStatus
    valid_from: datetime
    valid_until: datetime
    created_at: datetime
    updated_at: Optional[datetime] = None
    model_config = {"from_attributes": True}


class InviteCreatedResponse(BaseModel):
    invite_id: UUID
    invite_link: str
    qr_token: str
    visitor_name: str
    space_id: UUID
    invite_type: InviteType
    valid_from: datetime
    valid_until: datetime
    status: InviteStatus


class InviteListResponse(BaseModel):
    total: int
    invites: list[InviteResponse]
