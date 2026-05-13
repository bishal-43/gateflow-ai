"""services/visitor_service.py — Visitor access (no login required)"""
import base64, io
from fastapi import HTTPException, status
from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession
from security import decode_token
from models.invite import Invite, InviteStatus
from models.space import Space
from schemas.visitor import InviteOpenResponse, QRTokenResponse, VisitorDetailsResponse, VisitorSpaceInfo
from utils.logger import logger


def _qr_image(qr_token: str) -> str:
    try:
        import qrcode
        from qrcode.image.pure import PyPNGImage
        qr = qrcode.QRCode(version=1, error_correction=qrcode.constants.ERROR_CORRECT_M, box_size=10, border=4)
        qr.add_data(qr_token)
        qr.make(fit=True)
        buf = io.BytesIO()
        qr.make_image(image_factory=PyPNGImage).save(buf)
        return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()
    except ImportError:
        return "data:text/plain;base64," + base64.b64encode(qr_token.encode()).decode()


def _validate_token(token: str) -> dict:
    try:
        payload = decode_token(token)
    except JWTError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired invite link")
    if payload.get("role") != "visitor":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Not a visitor invite token")
    if not payload.get("invite_id"):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Malformed invite token")
    return payload


async def _load(db: AsyncSession, invite_id: str) -> tuple[Invite, Space]:
    invite = await db.get(Invite, invite_id)
    if invite is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Invite not found")
    if invite.status == InviteStatus.REVOKED:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "This invite has been revoked")
    if invite.status == InviteStatus.EXPIRED:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "This invite has expired")
    if invite.status == InviteStatus.USED:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "This invite has already been used")
    space = await db.get(Space, invite.space_id)
    if space is None or not space.is_active:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Space is no longer active")
    return invite, space


def _space_info(space: Space) -> VisitorSpaceInfo:
    return VisitorSpaceInfo(id=space.id, type=space.type, name=space.name,
                            venue=space.venue, address=space.address,
                            start_time=space.start_time, end_time=space.end_time)


async def get_invite_details(db: AsyncSession, token: str) -> InviteOpenResponse:
    payload = _validate_token(token)
    invite, space = await _load(db, payload["invite_id"])
    logger.info(f"[VISITOR] Opened: {invite.visitor_name!r} space={space.name!r}")
    return InviteOpenResponse(invite_id=invite.id, visitor_name=invite.visitor_name,
                              invite_type=invite.invite_type, status=invite.status,
                              valid_from=invite.valid_from, valid_until=invite.valid_until,
                              space=_space_info(space), qr_code_b64=_qr_image(invite.qr_token))


async def get_qr_data(db: AsyncSession, token: str) -> QRTokenResponse:
    payload = _validate_token(token)
    invite, _ = await _load(db, payload["invite_id"])
    return QRTokenResponse(qr_token=invite.qr_token, valid_from=invite.valid_from,
                           valid_until=invite.valid_until, status=invite.status)


async def get_visitor_space_details(db: AsyncSession, token: str) -> VisitorDetailsResponse:
    payload = _validate_token(token)
    invite, space = await _load(db, payload["invite_id"])
    return VisitorDetailsResponse(invite_id=invite.id, visitor_name=invite.visitor_name,
                                  visitor_email=invite.visitor_email, invite_type=invite.invite_type,
                                  status=invite.status, valid_from=invite.valid_from,
                                  valid_until=invite.valid_until, space=_space_info(space))
