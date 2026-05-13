"""schemas/document.py — Document request/response schemas"""
from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel


class DocumentResponse(BaseModel):
    id:          UUID
    space_id:    UUID
    uploaded_by: Optional[UUID]
    filename:    str
    file_path:   str
    file_size:   int       # bytes
    created_at:  datetime

    model_config = {"from_attributes": True}


class DocumentListResponse(BaseModel):
    space_id:  UUID
    total:     int
    documents: list[DocumentResponse]
