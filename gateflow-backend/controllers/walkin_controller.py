"""controllers/walkin_controller.py — Walk-in orchestration"""
from uuid import UUID

from fastapi import UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from models.user import User
from schemas.walkin import (
    WalkInApprovedResponse,
    WalkInCreateRequest,
    WalkInListResponse,
    WalkInRejectRequest,
    WalkInResponse,
)
from services.walkin_service import (
    approve_walkin_request,
    create_walkin_request,
    get_pending_requests,
    reject_walkin_request,
)


async def create(db: AsyncSession, data: WalkInCreateRequest, guard: User, proof_image: UploadFile | None) -> WalkInResponse:
    return await create_walkin_request(db, data, guard, proof_image)


async def approve(db: AsyncSession, walkin_id: UUID, approver: User) -> WalkInApprovedResponse:
    return await approve_walkin_request(db, walkin_id, approver)


async def reject(db: AsyncSession, walkin_id: UUID, data: WalkInRejectRequest, approver: User) -> WalkInResponse:
    return await reject_walkin_request(db, walkin_id, data, approver)


async def pending(db: AsyncSession, space_id: UUID | None, user: User) -> WalkInListResponse:
    return await get_pending_requests(db, space_id, user)
