"""controllers/dashboard_controller.py — Dashboard orchestration"""
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from schemas.dashboard import (
    EntriesResponse,
    OccupancyResponse,
    OverstaysResponse,
    StatsResponse,
    WalkInsResponse,
)
from services.dashboard_service import (
    get_entries,
    get_occupancy,
    get_overstays,
    get_stats,
    get_walkins,
)


async def stats(db: AsyncSession, space_id: UUID) -> StatsResponse:
    return await get_stats(db, space_id)


async def occupancy(db: AsyncSession, space_id: UUID) -> OccupancyResponse:
    return await get_occupancy(db, space_id)


async def entries(db: AsyncSession, space_id: UUID, limit: int) -> EntriesResponse:
    return await get_entries(db, space_id, limit)


async def walkins(db: AsyncSession, space_id: UUID) -> WalkInsResponse:
    return await get_walkins(db, space_id)


async def overstays(db: AsyncSession, space_id: UUID) -> OverstaysResponse:
    return await get_overstays(db, space_id)
