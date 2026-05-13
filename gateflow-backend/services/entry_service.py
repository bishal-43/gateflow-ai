"""services/entry_service.py — QR entry validation and session creation"""
from datetime import datetime, timezone
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from models.entry import EntrySession, EntryStatus
from models.invite import Invite, InviteStatus
from models.space import Space
from models.user import User
from schemas.entry import ActiveVisitorItem, ActiveVisitorsResponse, EntryScanResponse
from utils.logger import logger
from utils.redis_client import redis_client

_QR_USED = "qr_used:"
_QR_LOCK = "qr_lock:"
_USED_TTL = 86_400
_LOCK_TTL = 10


async def _is_used(qr: str) -> bool:
    return bool(await redis_client.exists(f"{_QR_USED}{qr}"))


async def _lock(qr: str) -> bool:
    return await redis_client.set(f"{_QR_LOCK}{qr}", "1", nx=True, ex=_LOCK_TTL) is not None


async def _mark_used(qr: str) -> None:
    await redis_client.setex(f"{_QR_USED}{qr}", _USED_TTL, "1")


async def _unlock(qr: str) -> None:
    await redis_client.delete(f"{_QR_LOCK}{qr}")


async def validate_qr(db: AsyncSession, qr_token: str) -> tuple[Invite, Space]:
    now = datetime.now(timezone.utc)

    if await _is_used(qr_token):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "QR code has already been used — duplicate scan blocked")

    if not await _lock(qr_token):
        raise HTTPException(status.HTTP_409_CONFLICT, "QR code is currently being processed — retry shortly")

    invite = (await db.execute(select(Invite).where(Invite.qr_token == qr_token))).scalar_one_or_none()
    if invite is None:
        await _unlock(qr_token)
        raise HTTPException(status.HTTP_404_NOT_FOUND, "QR code not found")

    if invite.status == InviteStatus.REVOKED:
        await _unlock(qr_token); raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invite has been revoked")
    if invite.status == InviteStatus.USED:
        await _mark_used(qr_token); await _unlock(qr_token)
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "QR code already used")
    if invite.status == InviteStatus.EXPIRED:
        await _unlock(qr_token); raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invite has expired")

    vf = invite.valid_from if invite.valid_from.tzinfo else invite.valid_from.replace(tzinfo=timezone.utc)
    vu = invite.valid_until if invite.valid_until.tzinfo else invite.valid_until.replace(tzinfo=timezone.utc)
    if now < vf:
        await _unlock(qr_token); raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Entry not yet allowed — valid from {vf.isoformat()}")
    if now > vu:
        await _unlock(qr_token); raise HTTPException(status.HTTP_400_BAD_REQUEST, f"QR code expired — valid until {vu.isoformat()}")

    space = await db.get(Space, invite.space_id)
    if space is None or not space.is_active:
        await _unlock(qr_token); raise HTTPException(status.HTTP_400_BAD_REQUEST, "Space is no longer active")

    return invite, space


async def create_entry_session(db: AsyncSession, qr_token: str, gate_id: str | None, guard: User) -> EntryScanResponse:
    invite, space = await validate_qr(db, qr_token)
    try:
        invite.status = InviteStatus.USED
        session = EntrySession(invite_id=invite.id, space_id=invite.space_id, scanned_by=guard.id,
                               visitor_name=invite.visitor_name, gate_id=gate_id,
                               allowed_until=invite.valid_until, status=EntryStatus.INSIDE)
        db.add(session)
        await db.commit()
        await db.refresh(session)
        await _mark_used(qr_token)
        logger.info(f"[ENTRY] ALLOWED: {invite.visitor_name!r} space={space.name!r} gate={gate_id}")
        # Notify live dashboard clients
        from websocket.dashboard_ws import broadcast_entry
        await broadcast_entry(session.space_id, session.visitor_name, session.id, session.gate_id)
        return EntryScanResponse(status="ALLOWED", visitor_name=session.visitor_name,
                                 session_id=session.id, invite_id=invite.id, space_id=session.space_id,
                                 gate_id=session.gate_id, entry_time=session.entry_time,
                                 allowed_until=session.allowed_until)
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, "Duplicate entry session — already scanned")
    finally:
        await _unlock(qr_token)


async def get_active_visitors(db: AsyncSession, space_id: UUID) -> ActiveVisitorsResponse:
    rows = (await db.execute(
        select(EntrySession).where(EntrySession.space_id == space_id, EntrySession.status == EntryStatus.INSIDE)
        .order_by(EntrySession.entry_time.asc())
    )).scalars().all()
    return ActiveVisitorsResponse(space_id=space_id, total=len(rows),
                                  visitors=[ActiveVisitorItem(session_id=s.id, invite_id=s.invite_id,
                                            visitor_name=s.visitor_name, gate_id=s.gate_id,
                                            entry_time=s.entry_time, allowed_until=s.allowed_until,
                                            status=s.status) for s in rows])
