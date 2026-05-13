"""routes/walkin_routes.py — Walk-in approval endpoints"""
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, Query, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

import controllers.walkin_controller as ctrl
from database import get_db
from dependencies import require_roles
from models.user import User
from schemas.common import ErrorResponse
from schemas.walkin import (
    WalkInApprovedResponse,
    WalkInListResponse,
    WalkInRejectRequest,
    WalkInResponse,
)

router = APIRouter()


@router.post(
    "/request",
    response_model=WalkInResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Guard submits a walk-in request for a visitor without an invite",
    responses={
        400: {"model": ErrorResponse, "description": "Walk-ins disabled or space inactive"},
        404: {"model": ErrorResponse, "description": "Space not found"},
    },
)
async def create_request(
    space_id:      UUID                  = Form(...),
    visitor_name:  str                   = Form(...),
    visitor_phone: Optional[str]         = Form(None),
    reason:        Optional[str]         = Form(None),
    proof_image:   Optional[UploadFile]  = File(None),
    db:    AsyncSession = Depends(get_db),
    guard: User         = Depends(require_roles("GUARD", "ADMIN")),
):
    from schemas.walkin import WalkInCreateRequest
    data = WalkInCreateRequest(
        space_id=space_id, visitor_name=visitor_name,
        visitor_phone=visitor_phone, reason=reason,
    )
    return await ctrl.create(db, data, guard, proof_image)


@router.post(
    "/approve/{walkin_id}",
    response_model=WalkInApprovedResponse,
    summary="Approve a walk-in — automatically creates a normal Invite with a QR token",
    responses={
        400: {"model": ErrorResponse, "description": "Already approved or rejected"},
        403: {"model": ErrorResponse, "description": "Not your space"},
        404: {"model": ErrorResponse, "description": "Walk-in request not found"},
    },
)
async def approve_request(
    walkin_id: UUID,
    db:       AsyncSession = Depends(get_db),
    approver: User         = Depends(require_roles("ORGANIZER", "ADMIN")),
):
    return await ctrl.approve(db, walkin_id, approver)


@router.post(
    "/reject/{walkin_id}",
    response_model=WalkInResponse,
    summary="Reject a walk-in request with an optional note",
    responses={
        400: {"model": ErrorResponse, "description": "Already processed"},
        403: {"model": ErrorResponse, "description": "Not your space"},
    },
)
async def reject_request(
    walkin_id: UUID,
    data:      WalkInRejectRequest = WalkInRejectRequest(),
    db:        AsyncSession        = Depends(get_db),
    approver:  User                = Depends(require_roles("ORGANIZER", "ADMIN")),
):
    return await ctrl.reject(db, walkin_id, data, approver)


@router.get(
    "/pending",
    response_model=WalkInListResponse,
    summary="List pending walk-in requests (scoped to organizer's own spaces)",
)
async def list_pending(
    space_id: Optional[UUID] = Query(None, description="Filter by a specific space"),
    db:   AsyncSession = Depends(get_db),
    user: User         = Depends(require_roles("ORGANIZER", "ADMIN")),
):
    return await ctrl.pending(db, space_id, user)
