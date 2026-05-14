"""schemas/visitor.py — Visitor-safe response schemas (no internal fields)"""
from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel
from models.invite import InviteStatus, InviteType
from models.space import SpaceType


class VisitorSpaceInfo(BaseModel):
    id: UUID
    type: SpaceType
    name: str
    venue: Optional[str] = None
    address: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    model_config = {"from_attributes": True}


class InviteOpenResponse(BaseModel):
    invite_id: UUID
    visitor_name: str
    invite_type: InviteType
    status: InviteStatus
    valid_from: datetime
    valid_until: datetime
    space: VisitorSpaceInfo
    qr_code_b64: str


class QRTokenResponse(BaseModel):
    qr_token: str
    valid_from: datetime
    valid_until: datetime
    status: InviteStatus


class VisitorDetailsResponse(BaseModel):
    invite_id: UUID
    visitor_name: str
    visitor_email: Optional[str] = None
    invite_type: InviteType
    status: InviteStatus
    valid_from: datetime
    valid_until: datetime
    space: VisitorSpaceInfo
