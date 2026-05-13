"""services/overstay_service.py — Overstay detection and resolution

check_overstays() is called by APScheduler every 5 minutes.
It finds INSIDE sessions that are past their allowed_until time
and marks them OVERSTAYED. Simple and readable.
"""
from datetime import datetime, timezone
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db_context
from models.entry import EntrySession, EntryStatus
from utils.logger import logger


# ── Scheduled job (called by APScheduler) ────────────────────────────────────

async def check_overstays() -> None:
    """
    Runs every 5 minutes.
    Finds all INSIDE sessions where allowed_until < now and marks them OVERSTAYED.
    Uses a context-managed DB session (not a FastAPI dependency).
    """
    now = datetime.now(timezone.utc)

    async with get_db_context() as db:
        result = await db.execute(
            update(EntrySession)
            .where(
                EntrySession.status == EntryStatus.INSIDE,
                EntrySession.allowed_until.isnot(None),
                EntrySession.allowed_until < now,
            )
            .values(status=EntryStatus.OVERSTAYED)
        )
        await db.commit()

        count = result.rowcount
        if count:
            logger.warning(f"[OVERSTAY] Marked {count} session(s) as OVERSTAYED")


# ── Manual resolve (called via API) ──────────────────────────────────────────

async def get_active_overstays(db: AsyncSession, space_id: UUID) -> list[EntrySession]:
    """Return all OVERSTAYED sessions for a space."""
    rows = (await db.execute(
        select(EntrySession)
        .where(EntrySession.space_id == space_id, EntrySession.status == EntryStatus.OVERSTAYED)
        .order_by(EntrySession.allowed_until.asc())
    )).scalars().all()
    return list(rows)


async def resolve_overstay(db: AsyncSession, session_id: UUID) -> EntrySession:
    """
    Organizer manually resolves an overstay — marks session as EXITED.
    Used when a visitor has physically left but wasn't scanned out.
    """
    session = await db.get(EntrySession, session_id)
    if session is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Entry session not found")
    if session.status != EntryStatus.OVERSTAYED:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Session is not OVERSTAYED (current: {session.status.value})")

    session.status    = EntryStatus.EXITED
    session.exit_time = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(session)
    logger.info(f"[OVERSTAY] Resolved: session={session_id} visitor={session.visitor_name!r}")
    return session
