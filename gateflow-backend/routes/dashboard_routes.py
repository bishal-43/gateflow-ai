"""routes/dashboard_routes.py — Dashboard read-only endpoints

All endpoints require ORGANIZER or ADMIN role and a ?space_id= query param.
"""
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

import controllers.dashboard_controller as ctrl
from database import get_db
from dependencies import require_roles
from models.user import User
from schemas.dashboard import EntriesResponse, OccupancyResponse, OverstaysResponse, StatsResponse, WalkInsResponse

router = APIRouter()


@router.get(
    "/stats", response_model=StatsResponse,
    summary="Overall counts for a space: inside, exited, overstayed, pending walk-ins",
)
async def stats(
    space_id: UUID = Query(..., description="Space to query"),
    db:   AsyncSession = Depends(get_db),
    _:    User         = Depends(require_roles("ORGANIZER", "ADMIN")),
):
    return await ctrl.stats(db, space_id)


@router.get(
    "/occupancy", response_model=OccupancyResponse,
    summary="Current inside vs exited counts for a space",
)
async def occupancy(
    space_id: UUID = Query(...),
    db: AsyncSession = Depends(get_db),
    _:  User         = Depends(require_roles("ORGANIZER", "ADMIN", "GUARD")),
):
    return await ctrl.occupancy(db, space_id)


@router.get(
    "/entries", response_model=EntriesResponse,
    summary="Recent entry sessions for a space (newest first)",
)
async def entries(
    space_id: UUID = Query(...),
    limit:    int  = Query(50, ge=1, le=200, description="Max rows to return"),
    db: AsyncSession = Depends(get_db),
    _:  User         = Depends(require_roles("ORGANIZER", "ADMIN")),
):
    return await ctrl.entries(db, space_id, limit)


@router.get(
    "/walkins", response_model=WalkInsResponse,
    summary="All walk-in requests for a space",
)
async def walkins(
    space_id: UUID = Query(...),
    db: AsyncSession = Depends(get_db),
    _:  User         = Depends(require_roles("ORGANIZER", "ADMIN")),
):
    return await ctrl.walkins(db, space_id)


@router.get(
    "/overstays", response_model=OverstaysResponse,
    summary="Sessions currently marked as OVERSTAYED for a space",
)
async def overstays(
    space_id: UUID = Query(...),
    db: AsyncSession = Depends(get_db),
    _:  User         = Depends(require_roles("ORGANIZER", "ADMIN")),
):
    return await ctrl.overstays(db, space_id)
