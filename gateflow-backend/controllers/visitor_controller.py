"""controllers/visitor_controller.py — Visitor access orchestration"""
from sqlalchemy.ext.asyncio import AsyncSession
from schemas.visitor import InviteOpenResponse, QRTokenResponse, VisitorDetailsResponse
from services.visitor_service import get_invite_details, get_qr_data, get_visitor_space_details


async def open_invite(db: AsyncSession, token: str) -> InviteOpenResponse:
    return await get_invite_details(db, token)


async def get_qr(db: AsyncSession, token: str) -> QRTokenResponse:
    return await get_qr_data(db, token)


async def get_details(db: AsyncSession, token: str) -> VisitorDetailsResponse:
    return await get_visitor_space_details(db, token)
