"""services/dashboard_service.py — Dashboard query logic

Each function runs simple, focused SELECT queries.
No complex joins — readable and easy to understand.
"""
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from models.entry import EntrySession, EntryStatus
from models.walkin import WalkInRequest, WalkInStatus
from schemas.dashboard import (
    EntriesResponse,
    EntryItem,
    OccupancyResponse,
    OverstayItem,
    OverstaysResponse,
    StatsResponse,
    WalkInItem,
    WalkInsResponse,
)


async def get_stats(db: AsyncSession, space_id: UUID) -> StatsResponse:
    """Single space summary — runs 5 small count queries."""

    async def count(where_clause) -> int:
        return (await db.execute(
            select(func.count()).select_from(EntrySession).where(
                EntrySession.space_id == space_id, where_clause
            )
        )).scalar_one()

    inside     = await count(EntrySession.status == EntryStatus.INSIDE)
    exited     = await count(EntrySession.status.in_([EntryStatus.EXITED, EntryStatus.ASSUMED_EXITED]))
    overstayed = await count(EntrySession.status == EntryStatus.OVERSTAYED)
    total      = await count(True)  # all sessions

    pending_walkins = (await db.execute(
        select(func.count()).select_from(WalkInRequest).where(
            WalkInRequest.space_id == space_id,
            WalkInRequest.status == WalkInStatus.PENDING,
        )
    )).scalar_one()

    return StatsResponse(
        space_id=space_id, inside=inside, exited=exited,
        overstayed=overstayed, pending_walkins=pending_walkins, total_entries=total,
    )


async def get_occupancy(db: AsyncSession, space_id: UUID) -> OccupancyResponse:
    """Current inside vs exited count."""
    rows = (await db.execute(
        select(EntrySession.status, func.count().label("n"))
        .where(EntrySession.space_id == space_id)
        .group_by(EntrySession.status)
    )).all()

    counts = {r.status: r.n for r in rows}
    inside = counts.get(EntryStatus.INSIDE, 0) + counts.get(EntryStatus.OVERSTAYED, 0)
    exited = counts.get(EntryStatus.EXITED, 0) + counts.get(EntryStatus.ASSUMED_EXITED, 0)

    return OccupancyResponse(space_id=space_id, inside=inside, exited=exited, total_scanned=inside + exited)


async def get_entries(db: AsyncSession, space_id: UUID, limit: int = 50) -> EntriesResponse:
    """Recent entry sessions for a space, newest first."""
    rows = (await db.execute(
        select(EntrySession)
        .where(EntrySession.space_id == space_id)
        .order_by(EntrySession.entry_time.desc())
        .limit(limit)
    )).scalars().all()

    total = (await db.execute(
        select(func.count()).select_from(EntrySession).where(EntrySession.space_id == space_id)
    )).scalar_one()

    return EntriesResponse(
        space_id=space_id, total=total,
        entries=[EntryItem(
            session_id=s.id, visitor_name=s.visitor_name, gate_id=s.gate_id,
            entry_time=s.entry_time, exit_time=s.exit_time,
            allowed_until=s.allowed_until, status=s.status,
        ) for s in rows],
    )


async def get_walkins(db: AsyncSession, space_id: UUID) -> WalkInsResponse:
    """All walk-in requests for a space, newest first."""
    rows = (await db.execute(
        select(WalkInRequest)
        .where(WalkInRequest.space_id == space_id)
        .order_by(WalkInRequest.created_at.desc())
    )).scalars().all()

    return WalkInsResponse(
        space_id=space_id, total=len(rows),
        requests=[WalkInItem(
            id=r.id, visitor_name=r.visitor_name,
            status=r.status, created_at=r.created_at,
        ) for r in rows],
    )


async def get_overstays(db: AsyncSession, space_id: UUID) -> OverstaysResponse:
    """Sessions currently marked OVERSTAYED for a space."""
    rows = (await db.execute(
        select(EntrySession)
        .where(EntrySession.space_id == space_id, EntrySession.status == EntryStatus.OVERSTAYED)
        .order_by(EntrySession.allowed_until.asc())
    )).scalars().all()

    return OverstaysResponse(
        space_id=space_id, total=len(rows),
        sessions=[OverstayItem(
            session_id=s.id, visitor_name=s.visitor_name,
            entry_time=s.entry_time, allowed_until=s.allowed_until,
        ) for s in rows],
    )
