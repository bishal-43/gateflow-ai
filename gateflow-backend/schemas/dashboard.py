"""schemas/dashboard.py — Dashboard response schemas"""
from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel

from models.entry import EntryStatus
from models.walkin import WalkInStatus


class StatsResponse(BaseModel):
    """High-level numbers for a space."""
    space_id:       UUID
    inside:         int   # currently INSIDE
    exited:         int   # EXITED + ASSUMED_EXITED
    overstayed:     int   # OVERSTAYED (still INSIDE but past allowed_until)
    pending_walkins: int  # PENDING walk-in requests
    total_entries:  int   # all-time entry sessions for this space


class OccupancyResponse(BaseModel):
    space_id:      UUID
    inside:        int
    exited:        int
    total_scanned: int


class EntryItem(BaseModel):
    session_id:   UUID
    visitor_name: str
    gate_id:      Optional[str]
    entry_time:   datetime
    exit_time:    Optional[datetime]
    allowed_until: Optional[datetime]
    status:       EntryStatus

    model_config = {"from_attributes": True}


class EntriesResponse(BaseModel):
    space_id: UUID
    total:    int
    entries:  list[EntryItem]


class WalkInItem(BaseModel):
    id:           UUID
    visitor_name: str
    status:       WalkInStatus
    created_at:   datetime

    model_config = {"from_attributes": True}


class WalkInsResponse(BaseModel):
    space_id: UUID
    total:    int
    requests: list[WalkInItem]


class OverstayItem(BaseModel):
    session_id:    UUID
    visitor_name:  str
    entry_time:    datetime
    allowed_until: Optional[datetime]

    model_config = {"from_attributes": True}


class OverstaysResponse(BaseModel):
    space_id: UUID
    total:    int
    sessions: list[OverstayItem]
