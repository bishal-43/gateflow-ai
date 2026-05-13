"""schemas/notification.py — Notification request/response schemas"""
from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field

from models.notification import NotificationType


class SendNotificationRequest(BaseModel):
    """Body for sending a notification to a specific user."""
    user_id:  UUID
    space_id: Optional[UUID]         = None
    type:     NotificationType
    title:    str                    = Field(..., min_length=1, max_length=200)
    message:  str                    = Field(..., min_length=1)


class NotificationResponse(BaseModel):
    id:         UUID
    user_id:    UUID
    space_id:   Optional[UUID]
    type:       NotificationType
    title:      str
    message:    str
    is_read:    bool
    created_at: datetime

    model_config = {"from_attributes": True}


class NotificationListResponse(BaseModel):
    total:         int
    unread:        int
    notifications: list[NotificationResponse]
