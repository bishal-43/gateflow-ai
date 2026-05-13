"""controllers/dashboard_controller.py — Dashboard orchestration"""
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from models.user import User
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
from services.space_service import ensure_space_access


async def stats(db: AsyncSession, space_id: UUID, user: User) -> StatsResponse:
    await ensure_space_access(db, space_id, user)
    return await get_stats(db, space_id)


async def occupancy(db: AsyncSession, space_id: UUID, user: User) -> OccupancyResponse:
    await ensure_space_access(db, space_id, user)
    return await get_occupancy(db, space_id)


async def entries(db: AsyncSession, space_id: UUID, limit: int, user: User) -> EntriesResponse:
    await ensure_space_access(db, space_id, user)
    return await get_entries(db, space_id, limit)


async def walkins(db: AsyncSession, space_id: UUID, user: User) -> WalkInsResponse:
    await ensure_space_access(db, space_id, user)
    return await get_walkins(db, space_id)


async def overstays(db: AsyncSession, space_id: UUID, user: User) -> OverstaysResponse:
    await ensure_space_access(db, space_id, user)
    return await get_overstays(db, space_id)
