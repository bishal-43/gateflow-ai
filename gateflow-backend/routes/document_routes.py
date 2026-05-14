"""routes/document_routes.py — Document upload endpoints"""
from uuid import UUID

from fastapi import APIRouter, Depends, File, Query, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

import controllers.document_controller as ctrl
from database import get_db
from dependencies import require_roles
from models.user import User
from schemas.common import ErrorResponse
from schemas.document import DocumentListResponse, DocumentResponse

router = APIRouter()


@router.post(
    "/upload",
    response_model=DocumentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload a PDF document for a space (max 20 MB)",
    responses={
        400: {"model": ErrorResponse, "description": "Invalid file type or file exceeds 20 MB"},
    },
)
async def upload_document(
    space_id: UUID       = Query(..., description="Space this document belongs to"),
    file:     UploadFile = File(...),
    db:       AsyncSession = Depends(get_db),
    user:     User         = Depends(require_roles("ORGANIZER", "RESIDENT", "ADMIN")),
):
    return await ctrl.upload(db, space_id, file, user)


@router.get(
    "/",
    response_model=DocumentListResponse,
    summary="List all PDF documents uploaded for a space",
)
async def list_documents(
    space_id: UUID = Query(...),
    db:   AsyncSession = Depends(get_db),
    user:     User         = Depends(require_roles("ORGANIZER", "RESIDENT", "ADMIN")),
):
    return await ctrl.list_all(db, space_id, user)


@router.delete(
    "/{doc_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a document — removes both the DB record and the file on disk",
    responses={404: {"model": ErrorResponse, "description": "Document not found"}},
)
async def delete_document(
    doc_id: UUID,
    db:   AsyncSession = Depends(get_db),
    user: User         = Depends(require_roles("ORGANIZER", "RESIDENT", "ADMIN")),
):
    await ctrl.delete(db, doc_id, user)
