"""services/walkin_service.py — Walk-in approval business logic

Walk-in flow:
  1. Guard creates WalkInRequest (PENDING)
  2. Organizer approves → service creates a normal Invite (type=WALKIN)
     and links it back to the WalkInRequest row
  3. Organizer rejects → WalkInRequest status = REJECTED

All QR scanning uses the SAME existing invite/entry flow — no new pipeline.
"""
import os
import shutil
import uuid
from datetime import datetime, timedelta, timezone
from uuid import UUID

from fastapi import HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.invite import Invite, InviteStatus, InviteType
from models.space import Space
from models.user import User, UserRole
from models.walkin import WalkInRequest, WalkInStatus
from schemas.walkin import (
    WalkInApprovedResponse,
    WalkInCreateRequest,
    WalkInListResponse,
    WalkInRejectRequest,
    WalkInResponse,
)
from services.invite_service import generate_invite_token, generate_qr_token, _link
from utils.logger import logger

_PROOF_DIR = "uploads/walkin"


# ── Internal helpers ──────────────────────────────────────────────────────────

def _to_resp(req: WalkInRequest) -> WalkInResponse:
    return WalkInResponse(
        id=req.id, space_id=req.space_id, requested_by=req.requested_by,
        visitor_name=req.visitor_name, visitor_phone=req.visitor_phone,
        reason=req.reason, proof_image=req.proof_image, status=req.status,
        rejected_note=req.rejected_note, invite_id=req.invite_id,
        created_at=req.created_at, updated_at=req.updated_at,
    )


async def _get_space(db: AsyncSession, space_id: UUID) -> Space:
    space = await db.get(Space, space_id)
    if space is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, f"Space {space_id} not found")
    if not space.is_active:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Space is inactive")
    if not space.walkin_enabled:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Walk-ins are disabled for this space")
    return space


async def _get_walkin(db: AsyncSession, walkin_id: UUID) -> WalkInRequest:
    req = await db.get(WalkInRequest, walkin_id)
    if req is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Walk-in request not found")
    return req


def _save_proof_image(file: UploadFile) -> str:
    """Save uploaded proof image to disk. Returns the saved file path."""
    os.makedirs(_PROOF_DIR, exist_ok=True)
    ext = os.path.splitext(file.filename or "")[1] or ".jpg"
    filename = f"{uuid.uuid4().hex}{ext}"
    path = os.path.join(_PROOF_DIR, filename)
    with open(path, "wb") as out:
        shutil.copyfileobj(file.file, out)
    return path


# ── Public service functions ──────────────────────────────────────────────────

async def create_walkin_request(
    db: AsyncSession,
    data: WalkInCreateRequest,
    guard: User,
    proof_image: UploadFile | None,
) -> WalkInResponse:
    """Guard creates a new walk-in request (status = PENDING)."""
    await _get_space(db, data.space_id)

    proof_path = _save_proof_image(proof_image) if proof_image else None

    req = WalkInRequest(
        space_id=data.space_id, requested_by=guard.id,
        visitor_name=data.visitor_name, visitor_phone=data.visitor_phone,
        reason=data.reason, proof_image=proof_path,
        status=WalkInStatus.PENDING,
    )
    db.add(req)
    await db.commit()
    await db.refresh(req)
    logger.info(f"[WALKIN] Request created: {req.visitor_name!r} by {guard.email}")
    # Notify live dashboard clients
    from websocket.dashboard_ws import broadcast_walkin
    await broadcast_walkin(req.space_id, req.visitor_name, req.id)
    return _to_resp(req)


async def approve_walkin_request(
    db: AsyncSession,
    walkin_id: UUID,
    approver: User,
) -> WalkInApprovedResponse:
    """
    Organizer approves a walk-in request.
    Creates a normal Invite (type=WALKIN) so the visitor can be scanned
    with the SAME existing QR entry flow — nothing new to learn.
    """
    req = await _get_walkin(db, walkin_id)

    if req.status != WalkInStatus.PENDING:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Request is already {req.status.value}")

    # Check approver owns the space (ADMIN can approve any)
    space = await db.get(Space, req.space_id)
    if approver.role != UserRole.ADMIN and space.owner_id != approver.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "You do not own this space")

    # Walk-in invite is valid from now until end of today (or space end_time if sooner)
    now = datetime.now(timezone.utc)
    end_of_day = now.replace(hour=23, minute=59, second=59, microsecond=0)
    space_end = space.end_time
    if space_end and space_end.tzinfo is None:
        space_end = space_end.replace(tzinfo=timezone.utc)
    valid_until = min(end_of_day, space_end) if space_end else end_of_day

    # Build invite — reuses the SAME token generation from invite_service
    invite_id = uuid.uuid4()
    invite_token = generate_invite_token(str(invite_id), str(req.space_id), InviteType.WALKIN, valid_until)
    qr_token = generate_qr_token()

    invite = Invite(
        id=invite_id, space_id=req.space_id, created_by=approver.id,
        visitor_name=req.visitor_name, visitor_phone=req.visitor_phone,
        invite_type=InviteType.WALKIN,
        invite_token=invite_token, qr_token=qr_token,
        valid_from=now, valid_until=valid_until,
        status=InviteStatus.ACTIVE,
    )
    db.add(invite)

    # Update walk-in request
    req.status    = WalkInStatus.APPROVED
    req.invite_id = invite_id

    await db.commit()
    await db.refresh(invite)
    logger.info(f"[WALKIN] Approved: {req.visitor_name!r} by {approver.email}, invite={invite_id}")

    return WalkInApprovedResponse(
        walkin_id=req.id, status=req.status,
        invite_id=invite.id, invite_link=_link(invite.invite_token),
        qr_token=invite.qr_token, visitor_name=invite.visitor_name,
        valid_from=invite.valid_from, valid_until=invite.valid_until,
    )


async def reject_walkin_request(
    db: AsyncSession,
    walkin_id: UUID,
    data: WalkInRejectRequest,
    approver: User,
) -> WalkInResponse:
    """Organizer rejects a walk-in request."""
    req = await _get_walkin(db, walkin_id)

    if req.status != WalkInStatus.PENDING:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Request is already {req.status.value}")

    space = await db.get(Space, req.space_id)
    if approver.role != UserRole.ADMIN and space.owner_id != approver.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "You do not own this space")

    req.status        = WalkInStatus.REJECTED
    req.rejected_note = data.note
    await db.commit()
    await db.refresh(req)
    logger.info(f"[WALKIN] Rejected: {req.visitor_name!r} by {approver.email}")
    return _to_resp(req)


async def get_pending_requests(
    db: AsyncSession,
    space_id: UUID | None,
    user: User,
) -> WalkInListResponse:
    """List PENDING walk-in requests. Organizer sees only their spaces."""
    filters = [WalkInRequest.status == WalkInStatus.PENDING]

    if user.role != UserRole.ADMIN:
        # join to spaces to filter by owner
        from models.space import Space as SpaceModel
        owned_space_ids = (await db.execute(
            select(SpaceModel.id).where(SpaceModel.owner_id == user.id)
        )).scalars().all()
        filters.append(WalkInRequest.space_id.in_(owned_space_ids))

    if space_id:
        filters.append(WalkInRequest.space_id == space_id)

    rows = (await db.execute(
        select(WalkInRequest).where(*filters).order_by(WalkInRequest.created_at.desc())
    )).scalars().all()

    return WalkInListResponse(total=len(rows), requests=[_to_resp(r) for r in rows])
