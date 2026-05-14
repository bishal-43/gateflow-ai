"""services/notification_service.py — Notification business logic

Simple CRUD:
  - send()        → create a Notification row
  - list_for_user() → paginate notifications for a user
  - mark_read()   → flip is_read = True
"""
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from models.notification import Notification, NotificationType
from models.user import User
from schemas.notification import (
    NotificationListResponse,
    NotificationResponse,
    SendNotificationRequest,
)
from utils.logger import logger


def _to_resp(n: Notification) -> NotificationResponse:
    return NotificationResponse(
        id=n.id, user_id=n.user_id, space_id=n.space_id,
        type=n.type, title=n.title, message=n.message,
        is_read=n.is_read, created_at=n.created_at,
    )


async def send_notification(db: AsyncSession, data: SendNotificationRequest) -> NotificationResponse:
    """Create and save a notification. Any authenticated ADMIN can call this."""
    notif = Notification(
        user_id=data.user_id, space_id=data.space_id,
        type=data.type, title=data.title, message=data.message,
    )
    db.add(notif)
    await db.commit()
    await db.refresh(notif)
    logger.info(f"[NOTIF] Sent type={notif.type} to user={notif.user_id}")
    return _to_resp(notif)


async def list_notifications(db: AsyncSession, user: User) -> NotificationListResponse:
    """Return all notifications for the current user, newest first."""
    rows = (await db.execute(
        select(Notification)
        .where(Notification.user_id == user.id)
        .order_by(Notification.created_at.desc())
    )).scalars().all()

    unread = sum(1 for n in rows if not n.is_read)
    return NotificationListResponse(total=len(rows), unread=unread, notifications=[_to_resp(n) for n in rows])


async def mark_as_read(db: AsyncSession, notif_id: UUID, user: User) -> NotificationResponse:
    """Mark a single notification as read. Users can only mark their own."""
    notif = await db.get(Notification, notif_id)
    if notif is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Notification not found")
    if notif.user_id != user.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Not your notification")
    notif.is_read = True
    await db.commit()
    await db.refresh(notif)
    return _to_resp(notif)


# ── Internal helper — called by other services ────────────────────────────────

async def create_notification(
    db: AsyncSession,
    user_id: UUID,
    notif_type: NotificationType,
    title: str,
    message: str,
    space_id: UUID | None = None,
) -> None:
    """
    Lightweight internal helper for creating notifications from other services.
    For example, overstay_service calls this when marking sessions OVERSTAYED.
    No return value — fire and forget inside a transaction.
    """
    notif = Notification(user_id=user_id, space_id=space_id, type=notif_type, title=title, message=message)
    db.add(notif)
    # Caller is responsible for calling db.commit()
