"""routes/notification_routes.py — Notification endpoints"""
from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

import controllers.notification_controller as ctrl
from database import get_db
from dependencies import get_current_user, require_roles
from models.user import User
from schemas.common import ErrorResponse
from schemas.notification import NotificationListResponse, NotificationResponse, SendNotificationRequest

router = APIRouter()


@router.post(
    "/send",
    response_model=NotificationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Send a notification to a specific user (ADMIN only)",
)
async def send_notification(
    data: SendNotificationRequest,
    db:   AsyncSession = Depends(get_db),
    _:    User         = Depends(require_roles("ADMIN")),
):
    return await ctrl.send(db, data)


@router.get(
    "/",
    response_model=NotificationListResponse,
    summary="List all notifications for the current user (includes unread count)",
)
async def list_notifications(
    db:   AsyncSession = Depends(get_db),
    user: User         = Depends(get_current_user),
):
    return await ctrl.list_all(db, user)


@router.patch(
    "/{notif_id}/read",
    response_model=NotificationResponse,
    summary="Mark a notification as read",
    responses={
        403: {"model": ErrorResponse, "description": "Cannot mark another user's notification"},
        404: {"model": ErrorResponse, "description": "Notification not found"},
    },
)
async def mark_read(
    notif_id: UUID,
    db:   AsyncSession = Depends(get_db),
    user: User         = Depends(get_current_user),
):
    return await ctrl.read(db, notif_id, user)
