"""controllers/overstay_controller.py — Overstay orchestration"""
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from models.entry import EntrySession
from services.overstay_service import get_active_overstays, resolve_overstay


async def active(db: AsyncSession, space_id: UUID) -> list[EntrySession]:
    return await get_active_overstays(db, space_id)


async def resolve(db: AsyncSession, session_id: UUID) -> EntrySession:
    return await resolve_overstay(db, session_id)
