"""
tests/test_documents.py — Document upload flow tests

Covers:
  - valid PDF upload
  - invalid file type (non-PDF) → 400
  - oversized file → 400
  - list documents
  - delete document
"""
import io
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from tests.helpers import auth_headers, create_space

pytestmark = pytest.mark.asyncio

_SMALL_PDF = b"%PDF-1.4 small test pdf"   # minimal fake PDF bytes


async def test_upload_valid_pdf(client: AsyncClient, db: AsyncSession):
    headers = await auth_headers(client, db, "ORGANIZER")
    space   = await create_space(client, headers)

    resp = await client.post(
        f"/documents/upload?space_id={space['id']}",
        files={"file": ("test.pdf", io.BytesIO(_SMALL_PDF), "application/pdf")},
        headers=headers,
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["filename"] == "test.pdf"
    assert data["file_size"] == len(_SMALL_PDF)


async def test_upload_invalid_file_type(client: AsyncClient, db: AsyncSession):
    """Uploading a non-PDF must return 400."""
    headers = await auth_headers(client, db, "ORGANIZER")
    space   = await create_space(client, headers)

    resp = await client.post(
        f"/documents/upload?space_id={space['id']}",
        files={"file": ("evil.exe", io.BytesIO(b"MZ\x90\x00"), "application/octet-stream")},
        headers=headers,
    )
    assert resp.status_code == 400


async def test_upload_oversized_file(client: AsyncClient, db: AsyncSession):
    """A file larger than 20 MB must return 400."""
    headers = await auth_headers(client, db, "ORGANIZER")
    space   = await create_space(client, headers)

    big_content = b"A" * (21 * 1024 * 1024)  # 21 MB
    resp = await client.post(
        f"/documents/upload?space_id={space['id']}",
        files={"file": ("big.pdf", io.BytesIO(big_content), "application/pdf")},
        headers=headers,
    )
    assert resp.status_code == 400


async def test_list_documents(client: AsyncClient, db: AsyncSession):
    headers = await auth_headers(client, db, "ORGANIZER")
    space   = await create_space(client, headers)

    await client.post(
        f"/documents/upload?space_id={space['id']}",
        files={"file": ("doc.pdf", io.BytesIO(_SMALL_PDF), "application/pdf")},
        headers=headers,
    )

    resp = await client.get(f"/documents/?space_id={space['id']}", headers=headers)
    assert resp.status_code == 200
    assert resp.json()["total"] == 1


async def test_delete_document(client: AsyncClient, db: AsyncSession):
    headers = await auth_headers(client, db, "ORGANIZER")
    space   = await create_space(client, headers)

    upload = await client.post(
        f"/documents/upload?space_id={space['id']}",
        files={"file": ("todel.pdf", io.BytesIO(_SMALL_PDF), "application/pdf")},
        headers=headers,
    )
    doc_id = upload.json()["id"]

    resp = await client.delete(f"/documents/{doc_id}", headers=headers)
    assert resp.status_code == 204
