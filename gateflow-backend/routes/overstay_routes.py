"""routes/overstay_routes.py — Overstay detection endpoints"""
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

import controllers.overstay_controller as ctrl
from database import get_db
from dependencies import require_roles
from models.user import User
from schemas.common import ErrorResponse
from schemas.dashboard import OverstayItem, OverstaysResponse

router = APIRouter()


@router.get(
    "/active", response_model=OverstaysResponse,
    summary="List all OVERSTAYED sessions for a space",
)
async def active_overstays(
    space_id: UUID = Query(...),
    db:   AsyncSession = Depends(get_db),
    user: User         = Depends(require_roles("ORGANIZER", "RESIDENT", "ADMIN")),
):
    sessions = await ctrl.active(db, space_id, user)
    return OverstaysResponse(
        space_id=space_id,
        total=len(sessions),
        sessions=[
            OverstayItem(
                session_id=s.id, visitor_name=s.visitor_name,
                entry_time=s.entry_time, allowed_until=s.allowed_until,
            )
            for s in sessions
        ],
    )


@router.post(
    "/resolve/{session_id}",
    response_model=OverstayItem,
    summary="Manually resolve an overstay — marks the session as EXITED",
    responses={
        400: {"model": ErrorResponse, "description": "Session is not in OVERSTAYED status"},
        404: {"model": ErrorResponse, "description": "Entry session not found"},
    },
)
async def resolve_overstay(
    session_id: UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles("ORGANIZER", "RESIDENT", "ADMIN")),
):
    session = await ctrl.resolve(db, session_id, user)
    return OverstayItem(
        session_id=session.id, visitor_name=session.visitor_name,
        entry_time=session.entry_time, allowed_until=session.allowed_until,
    )
