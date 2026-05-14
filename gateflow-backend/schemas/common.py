"""schemas/common.py — Shared response schemas used across all modules

Import these instead of writing one-off response classes:
  from schemas.common import MessageResponse, ErrorResponse, SuccessResponse
"""
from typing import Any, Optional
from pydantic import BaseModel


class MessageResponse(BaseModel):
    """Generic single-message response. Example: {'message': 'Done'}"""
    message: str


class SuccessResponse(BaseModel):
    """Response for operations that succeed with a descriptive message."""
    success: bool = True
    message: str


class ErrorResponse(BaseModel):
    """
    Standard error body returned by FastAPI's HTTPException handler.
    Useful for documenting error responses in Swagger.
    """
    detail: str


class PaginationMeta(BaseModel):
    """Attach to list responses when you need page info."""
    total:  int
    limit:  int
    offset: int
