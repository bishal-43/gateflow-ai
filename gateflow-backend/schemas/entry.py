"""schemas/entry.py — Entry & Exit request/response schemas"""
from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, Field
from models.entry import EntryStatus


class EntryScanRequest(BaseModel):
    qr_token: str = Field(..., min_length=1, max_length=64)
    gate_id: Optional[str] = Field(None, max_length=100)


class ExitScanRequest(BaseModel):
    qr_token: str = Field(..., min_length=1, max_length=64)
    gate_id: Optional[str] = Field(None, max_length=100)


class EntryScanResponse(BaseModel):
    status: str
    visitor_name: str
    session_id: UUID
    invite_id: UUID
    space_id: UUID
    gate_id: Optional[str]
    entry_time: datetime
    allowed_until: Optional[datetime]


class ExitScanResponse(BaseModel):
    status: str
    visitor_name: str
    session_id: UUID
    exit_time: datetime


class ActiveVisitorItem(BaseModel):
    session_id: UUID
    invite_id: UUID
    visitor_name: str
    gate_id: Optional[str]
    entry_time: datetime
    allowed_until: Optional[datetime]
    status: EntryStatus
    model_config = {"from_attributes": True}


class ActiveVisitorsResponse(BaseModel):
    space_id: UUID
    total: int
    visitors: list[ActiveVisitorItem]


class OccupancyResponse(BaseModel):
    space_id: UUID
    inside: int
    exited: int
    total_scanned: int
