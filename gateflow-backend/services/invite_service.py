"""services/invite_service.py — Invite business logic"""
import uuid
from datetime import datetime, timezone
from typing import Any
from uuid import UUID

from fastapi import HTTPException, status
from jose import jwt
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from config import settings
from models.invite import Invite, InviteStatus, InviteType
from models.space import Space
from models.user import User, UserRole
from schemas.invite import CreateInviteRequest, InviteCreatedResponse, InviteListResponse, InviteResponse, UpdateInviteRequest
from utils.logger import logger

_INVITE_BASE_URL = "https://gateflow.ai/invite"


def generate_invite_token(invite_id: str, space_id: str, invite_type: InviteType, valid_until: datetime) -> str:
    payload: dict[str, Any] = {"invite_id": invite_id, "space_id": space_id,
                                "invite_type": invite_type.value, "role": "visitor",
                                "exp": valid_until, "iat": datetime.now(timezone.utc)}
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def generate_qr_token() -> str:
    return uuid.uuid4().hex


def _link(token: str) -> str:
    return f"{_INVITE_BASE_URL}/{token}"


def _to_resp(invite: Invite) -> InviteResponse:
    return InviteResponse(id=invite.id, space_id=invite.space_id, created_by=invite.created_by,
                          visitor_name=invite.visitor_name, visitor_email=invite.visitor_email,
                          visitor_phone=invite.visitor_phone, invite_type=invite.invite_type,
                          invite_link=_link(invite.invite_token), status=invite.status,
                          valid_from=invite.valid_from, valid_until=invite.valid_until,
                          created_at=invite.created_at, updated_at=invite.updated_at)


async def _get_space(db: AsyncSession, space_id: UUID, user: User) -> Space:
    space = await db.get(Space, space_id)
    if space is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, f"Space {space_id} not found")
    if not space.is_active:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Space is inactive")
    if user.role != UserRole.ADMIN and space.owner_id != user.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "You do not own this space")
    return space


async def _get_invite(db: AsyncSession, invite_id: UUID, user: User) -> Invite:
    invite = await db.get(Invite, invite_id)
    if invite is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, f"Invite {invite_id} not found")
    if user.role != UserRole.ADMIN and invite.created_by != user.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "You do not own this invite")
    return invite


async def create_invite(db: AsyncSession, data: CreateInviteRequest, user: User) -> InviteCreatedResponse:
    await _get_space(db, data.space_id, user)
    invite_id = uuid.uuid4()
    invite_token = generate_invite_token(str(invite_id), str(data.space_id), data.invite_type, data.valid_until)
    qr_token = generate_qr_token()
    invite = Invite(id=invite_id, space_id=data.space_id, created_by=user.id,
                    visitor_name=data.visitor_name, visitor_email=data.visitor_email,
                    visitor_phone=data.visitor_phone, invite_type=data.invite_type,
                    invite_token=invite_token, qr_token=qr_token,
                    valid_from=data.valid_from, valid_until=data.valid_until, status=InviteStatus.ACTIVE)
    db.add(invite)
    await db.commit()
    await db.refresh(invite)
    logger.info(f"[INVITE] Created: {invite.visitor_name!r} by {user.email}")
    return InviteCreatedResponse(invite_id=invite.id, invite_link=_link(invite.invite_token),
                                 qr_token=invite.qr_token, visitor_name=invite.visitor_name,
                                 space_id=invite.space_id, invite_type=invite.invite_type,
                                 valid_from=invite.valid_from, valid_until=invite.valid_until, status=invite.status)


async def get_invites(db: AsyncSession, user: User, space_id: UUID | None = None, status_filter: InviteStatus | None = None) -> InviteListResponse:
    filters = [] if user.role == UserRole.ADMIN else [Invite.created_by == user.id]
    if space_id:
        filters.append(Invite.space_id == space_id)
    if status_filter:
        filters.append(Invite.status == status_filter)
    total = (await db.execute(select(func.count()).select_from(Invite).where(*filters))).scalar_one()
    rows = (await db.execute(select(Invite).where(*filters).order_by(Invite.created_at.desc()))).scalars().all()
    return InviteListResponse(total=total, invites=[_to_resp(i) for i in rows])


async def get_invite_by_id(db: AsyncSession, invite_id: UUID, user: User) -> InviteResponse:
    return _to_resp(await _get_invite(db, invite_id, user))


async def update_invite(db: AsyncSession, invite_id: UUID, data: UpdateInviteRequest, user: User) -> InviteResponse:
    invite = await _get_invite(db, invite_id, user)
    if invite.status == InviteStatus.REVOKED:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Revoked invites cannot be updated")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(invite, field, value)
    if invite.valid_from and invite.valid_until:
        vf = invite.valid_from if invite.valid_from.tzinfo else invite.valid_from.replace(tzinfo=timezone.utc)
        vu = invite.valid_until if invite.valid_until.tzinfo else invite.valid_until.replace(tzinfo=timezone.utc)
        if vu <= vf:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "valid_until must be after valid_from")
    await db.commit()
    await db.refresh(invite)
    return _to_resp(invite)


async def revoke_invite(db: AsyncSession, invite_id: UUID, user: User) -> None:
    invite = await _get_invite(db, invite_id, user)
    if invite.status == InviteStatus.REVOKED:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invite is already revoked")
    invite.status = InviteStatus.REVOKED
    await db.commit()
    logger.info(f"[INVITE] Revoked: {invite.visitor_name!r} by {user.email}")
