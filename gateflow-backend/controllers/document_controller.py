"""controllers/document_controller.py — Document orchestration"""
from uuid import UUID

from fastapi import UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from models.user import User
from schemas.document import DocumentListResponse, DocumentResponse
from services.document_service import delete_document, list_documents, upload_document


async def upload(db: AsyncSession, space_id: UUID, file: UploadFile, user: User) -> DocumentResponse:
    return await upload_document(db, space_id, file, user)


async def list_all(db: AsyncSession, space_id: UUID, user: User) -> DocumentListResponse:
    return await list_documents(db, space_id, user)


async def delete(db: AsyncSession, doc_id: UUID, user: User) -> None:
    await delete_document(db, doc_id, user)
