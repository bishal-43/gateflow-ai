"""schemas/walkin.py — Walk-in request/response Pydantic schemas"""
from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field

from models.walkin import WalkInStatus


# ── Requests ──────────────────────────────────────────────────────────────────

class WalkInCreateRequest(BaseModel):
    """Body sent by a guard to create a walk-in request."""
    space_id:     UUID
    visitor_name: str              = Field(..., min_length=1, max_length=200)
    visitor_phone: Optional[str]  = Field(None, max_length=20)
    reason:        Optional[str]  = Field(None, max_length=500)
    # proof_image comes via UploadFile (multipart), not in this JSON body


class WalkInRejectRequest(BaseModel):
    """Optional body when rejecting — organizer can leave a note."""
    note: Optional[str] = Field(None, max_length=500)


# ── Responses ─────────────────────────────────────────────────────────────────

class WalkInResponse(BaseModel):
    """Returned for a single walk-in request."""
    id:            UUID
    space_id:      UUID
    requested_by:  Optional[UUID]
    visitor_name:  str
    visitor_phone: Optional[str]
    reason:        Optional[str]
    proof_image:   Optional[str]
    status:        WalkInStatus
    rejected_note: Optional[str]
    invite_id:     Optional[UUID]   # set after approval
    created_at:    datetime
    updated_at:    datetime

    model_config = {"from_attributes": True}


class WalkInApprovedResponse(BaseModel):
    """Returned after approval — includes the generated invite details."""
    walkin_id:   UUID
    status:      WalkInStatus
    invite_id:   UUID
    invite_link: str
    qr_token:    str
    visitor_name: str
    valid_from:  datetime
    valid_until: datetime


class WalkInListResponse(BaseModel):
    total:    int
    requests: list[WalkInResponse]
