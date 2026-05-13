"""services/exit_service.py — QR exit processing

Note: occupancy queries live in dashboard_service.py to avoid duplication.
The exit route's /occupancy endpoint calls dashboard_service directly.
"""
from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.entry import EntrySession, EntryStatus
from models.invite import Invite
from models.user import User
from schemas.entry import ExitScanResponse
from utils.logger import logger


async def process_exit(db: AsyncSession, qr_token: str, gate_id: str | None, guard: User) -> ExitScanResponse:
    invite = (await db.execute(select(Invite).where(Invite.qr_token == qr_token))).scalar_one_or_none()
    if invite is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "QR code not found")

    session = (await db.execute(
        select(EntrySession).where(EntrySession.invite_id == invite.id)
    )).scalar_one_or_none()
    if session is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No entry session found — visitor may not have entered yet")

    if session.status == EntryStatus.EXITED:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Visitor has already exited")
    if session.status == EntryStatus.ASSUMED_EXITED:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Session was already auto-closed")

    session.status    = EntryStatus.EXITED
    session.exit_time = datetime.now(timezone.utc)
    if gate_id:
        session.gate_id = gate_id

    await db.commit()
    await db.refresh(session)
    logger.info(f"[EXIT] EXITED: {session.visitor_name!r} space={session.space_id}")

    # Notify live dashboard clients
    from websocket.dashboard_ws import broadcast_exit
    await broadcast_exit(session.space_id, session.visitor_name, session.id)

    return ExitScanResponse(
        status="EXITED",
        visitor_name=session.visitor_name,
        session_id=session.id,
        exit_time=session.exit_time,
    )
