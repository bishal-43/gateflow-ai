"""controllers/overstay_controller.py — Overstay orchestration"""
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from models.entry import EntrySession
from models.user import User
from services.overstay_service import get_active_overstays, resolve_overstay
from services.space_service import ensure_space_access


async def active(db: AsyncSession, space_id: UUID, user: User) -> list[EntrySession]:
    await ensure_space_access(db, space_id, user)
    return await get_active_overstays(db, space_id)


async def resolve(db: AsyncSession, session_id: UUID, user: User) -> EntrySession:
    session = await db.get(EntrySession, session_id)
    if session is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Entry session not found")
    await ensure_space_access(db, session.space_id, user)
    return await resolve_overstay(db, session_id)
