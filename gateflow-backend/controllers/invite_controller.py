"""controllers/invite_controller.py — Invite orchestration"""
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from models.invite import InviteStatus
from models.user import User
from schemas.invite import CreateInviteRequest, InviteCreatedResponse, InviteListResponse, InviteResponse, UpdateInviteRequest
from services.invite_service import create_invite, get_invite_by_id, get_invites, revoke_invite, update_invite


async def create(db: AsyncSession, data: CreateInviteRequest, user: User) -> InviteCreatedResponse:
    return await create_invite(db, data, user)


async def list_invites(db: AsyncSession, user: User, space_id: UUID | None = None, status_filter: InviteStatus | None = None) -> InviteListResponse:
    return await get_invites(db, user, space_id, status_filter)


async def get_one(db: AsyncSession, invite_id: UUID, user: User) -> InviteResponse:
    return await get_invite_by_id(db, invite_id, user)


async def update(db: AsyncSession, invite_id: UUID, data: UpdateInviteRequest, user: User) -> InviteResponse:
    return await update_invite(db, invite_id, data, user)


async def revoke(db: AsyncSession, invite_id: UUID, user: User) -> None:
    await revoke_invite(db, invite_id, user)
