"""routes/entry_routes.py — QR entry endpoints"""
from uuid import UUID
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
import controllers.entry_controller as ctrl
from database import get_db
from dependencies import require_roles
from models.user import User
from schemas.entry import ActiveVisitorsResponse, EntryScanRequest, EntryScanResponse

router = APIRouter()


@router.post("/scan", response_model=EntryScanResponse)
async def scan(data: EntryScanRequest, db: AsyncSession = Depends(get_db), guard: User = Depends(require_roles("GUARD", "ADMIN"))):
    return await ctrl.scan_entry(db, data, guard)


@router.get("/active", response_model=ActiveVisitorsResponse)
async def active(space_id: UUID = Query(...), db: AsyncSession = Depends(get_db), _: User = Depends(require_roles("GUARD", "ORGANIZER", "RESIDENT", "ADMIN"))):
    return await ctrl.active_visitors(db, space_id)
