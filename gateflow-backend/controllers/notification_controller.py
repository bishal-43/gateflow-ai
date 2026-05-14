"""controllers/notification_controller.py — Notification orchestration"""
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from models.user import User
from schemas.notification import (
    NotificationListResponse,
    NotificationResponse,
    SendNotificationRequest,
)
from services.notification_service import list_notifications, mark_as_read, send_notification


async def send(db: AsyncSession, data: SendNotificationRequest) -> NotificationResponse:
    return await send_notification(db, data)


async def list_all(db: AsyncSession, user: User) -> NotificationListResponse:
    return await list_notifications(db, user)


async def read(db: AsyncSession, notif_id: UUID, user: User) -> NotificationResponse:
    return await mark_as_read(db, notif_id, user)
