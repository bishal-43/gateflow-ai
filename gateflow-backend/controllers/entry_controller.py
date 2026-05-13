"""controllers/entry_controller.py — Entry orchestration"""
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from models.user import User
from schemas.entry import ActiveVisitorsResponse, EntryScanRequest, EntryScanResponse
from services.entry_service import create_entry_session, get_active_visitors


async def scan_entry(db: AsyncSession, data: EntryScanRequest, guard: User) -> EntryScanResponse:
    return await create_entry_session(db, data.qr_token, data.gate_id, guard)


async def active_visitors(db: AsyncSession, space_id: UUID) -> ActiveVisitorsResponse:
    return await get_active_visitors(db, space_id)
