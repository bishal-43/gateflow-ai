"""routes/invite_routes.py — Invite endpoints only"""
from uuid import UUID
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
import controllers.invite_controller as ctrl
from database import get_db
from dependencies import require_roles
from models.invite import InviteStatus
from models.user import User
from schemas.invite import CreateInviteRequest, InviteCreatedResponse, InviteListResponse, InviteResponse, UpdateInviteRequest

router = APIRouter()
_ROLES = ("ORGANIZER", "RESIDENT", "ADMIN")


@router.post("", response_model=InviteCreatedResponse, status_code=201)
async def create(data: CreateInviteRequest, db: AsyncSession = Depends(get_db), user: User = Depends(require_roles(*_ROLES))):
    return await ctrl.create(db, data, user)


@router.get("", response_model=InviteListResponse)
async def list_invites(space_id: UUID | None = Query(None), invite_status: InviteStatus | None = Query(None, alias="status"),
                       db: AsyncSession = Depends(get_db), user: User = Depends(require_roles(*_ROLES))):
    return await ctrl.list_invites(db, user, space_id, invite_status)


@router.get("/{invite_id}", response_model=InviteResponse)
async def get_one(invite_id: UUID, db: AsyncSession = Depends(get_db), user: User = Depends(require_roles(*_ROLES))):
    return await ctrl.get_one(db, invite_id, user)


@router.put("/{invite_id}", response_model=InviteResponse)
async def update(invite_id: UUID, data: UpdateInviteRequest, db: AsyncSession = Depends(get_db), user: User = Depends(require_roles(*_ROLES))):
    return await ctrl.update(db, invite_id, data, user)


@router.delete("/{invite_id}", status_code=status.HTTP_204_NO_CONTENT)
async def revoke(invite_id: UUID, db: AsyncSession = Depends(get_db), user: User = Depends(require_roles(*_ROLES))):
    await ctrl.revoke(db, invite_id, user)
