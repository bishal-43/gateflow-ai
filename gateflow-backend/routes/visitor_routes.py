"""routes/visitor_routes.py — Public visitor endpoints (no auth required)"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
import controllers.visitor_controller as ctrl
from database import get_db
from schemas.visitor import InviteOpenResponse, QRTokenResponse, VisitorDetailsResponse

router = APIRouter()


@router.get("/invite/{token}", response_model=InviteOpenResponse)
async def open_invite(token: str, db: AsyncSession = Depends(get_db)):
    return await ctrl.open_invite(db, token)


@router.get("/qr/{token}", response_model=QRTokenResponse)
async def get_qr(token: str, db: AsyncSession = Depends(get_db)):
    return await ctrl.get_qr(db, token)


@router.get("/details/{token}", response_model=VisitorDetailsResponse)
async def get_details(token: str, db: AsyncSession = Depends(get_db)):
    return await ctrl.get_details(db, token)
