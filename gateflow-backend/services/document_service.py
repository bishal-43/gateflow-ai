"""services/document_service.py — Document upload/list/delete logic

Rules:
  - PDF only (checked by content type AND extension)
  - Max 20 MB
  - File saved to uploads/documents/
  - Only path + metadata stored in DB
"""
import os
import shutil
import uuid
from uuid import UUID

from fastapi import HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.document import Document
from models.user import User
from schemas.document import DocumentListResponse, DocumentResponse
from utils.logger import logger

_UPLOAD_DIR  = "uploads/documents"
_MAX_SIZE    = 20 * 1024 * 1024   # 20 MB in bytes
_ALLOWED_EXT = {".pdf"}
_ALLOWED_CT  = {"application/pdf"}


def _to_resp(doc: Document) -> DocumentResponse:
    return DocumentResponse(
        id=doc.id, space_id=doc.space_id, uploaded_by=doc.uploaded_by,
        filename=doc.filename, file_path=doc.file_path,
        file_size=doc.file_size, created_at=doc.created_at,
    )


def _validate_file(file: UploadFile) -> None:
    """Raise HTTP 400 if file is not a PDF or exceeds 20 MB."""
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in _ALLOWED_EXT:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Only PDF files are allowed")
    if file.content_type not in _ALLOWED_CT:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid content type — must be application/pdf")


def _save_file(file: UploadFile) -> tuple[str, int]:
    """
    Save the file to disk and return (file_path, size_in_bytes).
    Reads the entire file into memory to check size BEFORE saving.
    """
    os.makedirs(_UPLOAD_DIR, exist_ok=True)
    content = file.file.read()

    if len(content) > _MAX_SIZE:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"File too large — max {_MAX_SIZE // (1024*1024)} MB")

    filename = f"{uuid.uuid4().hex}.pdf"
    path = os.path.join(_UPLOAD_DIR, filename)
    with open(path, "wb") as out:
        out.write(content)

    return path, len(content)


async def upload_document(db: AsyncSession, space_id: UUID, file: UploadFile, user: User) -> DocumentResponse:
    _validate_file(file)
    file_path, file_size = _save_file(file)

    doc = Document(
        space_id=space_id, uploaded_by=user.id,
        filename=file.filename or "upload.pdf",
        file_path=file_path, file_size=file_size,
    )
    db.add(doc)
    await db.commit()
    await db.refresh(doc)
    logger.info(f"[DOC] Uploaded: {doc.filename!r} size={file_size} by {user.email}")
    return _to_resp(doc)


async def list_documents(db: AsyncSession, space_id: UUID) -> DocumentListResponse:
    rows = (await db.execute(
        select(Document)
        .where(Document.space_id == space_id)
        .order_by(Document.created_at.desc())
    )).scalars().all()

    return DocumentListResponse(space_id=space_id, total=len(rows), documents=[_to_resp(d) for d in rows])


async def delete_document(db: AsyncSession, doc_id: UUID, user: User) -> None:
    doc = await db.get(Document, doc_id)
    if doc is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Document not found")

    # Remove physical file first, then DB row
    if os.path.exists(doc.file_path):
        os.remove(doc.file_path)

    await db.delete(doc)
    await db.commit()
    logger.info(f"[DOC] Deleted: {doc.filename!r} by {user.email}")
