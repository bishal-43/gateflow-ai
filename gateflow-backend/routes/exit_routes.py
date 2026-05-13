"""routes/exit_routes.py — QR exit endpoints"""
from uuid import UUID
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
import controllers.exit_controller as ctrl
from database import get_db
from dependencies import require_roles
from models.user import User
from schemas.entry import ExitScanRequest, ExitScanResponse, OccupancyResponse

router = APIRouter()


@router.post("/scan", response_model=ExitScanResponse)
async def scan(data: ExitScanRequest, db: AsyncSession = Depends(get_db), guard: User = Depends(require_roles("GUARD", "ADMIN"))):
    return await ctrl.scan_exit(db, data, guard)


@router.get("/occupancy", response_model=OccupancyResponse)
async def occupancy(space_id: UUID = Query(...), db: AsyncSession = Depends(get_db), _: User = Depends(require_roles("GUARD", "ORGANIZER", "RESIDENT", "ADMIN"))):
    return await ctrl.occupancy(db, space_id)
