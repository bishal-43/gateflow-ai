"""controllers/exit_controller.py — Exit orchestration"""
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from models.user import User
from schemas.entry import ExitScanRequest, ExitScanResponse
from schemas.entry import OccupancyResponse
from services.exit_service import process_exit
from services.dashboard_service import get_occupancy


async def scan_exit(db: AsyncSession, data: ExitScanRequest, guard: User) -> ExitScanResponse:
    return await process_exit(db, data.qr_token, data.gate_id, guard)


async def occupancy(db: AsyncSession, space_id: UUID) -> OccupancyResponse:
    # Reuse the dashboard service — single source of truth for occupancy
    result = await get_occupancy(db, space_id)
    return OccupancyResponse(
        space_id=result.space_id,
        inside=result.inside,
        exited=result.exited,
        total_scanned=result.total_scanned,
    )
