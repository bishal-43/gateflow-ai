"""
tests/test_invites.py — Invite flow tests

Covers:
  - create invite
  - get invite by id
  - list invites
  - revoke invite
  - invalid ownership (another user's invite)
"""
import pytest
from datetime import datetime, timedelta, timezone
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from tests.helpers import auth_headers, create_space

pytestmark = pytest.mark.asyncio


def _invite_payload(space_id: str) -> dict:
    now = datetime.now(timezone.utc)
    return {
        "space_id":      space_id,
        "visitor_name":  "Jane Visitor",
        "visitor_email": "jane@example.com",
        "visitor_phone": "9876543210",
        "invite_type":   "EVENT_GUEST",
        "valid_from":    now.isoformat(),
        "valid_until":   (now + timedelta(hours=4)).isoformat(),
    }


async def test_create_invite(client: AsyncClient, db: AsyncSession):
    headers = await auth_headers(client, db, "ORGANIZER")
    space   = await create_space(client, headers)
    resp = await client.post("/invites", json=_invite_payload(space["id"]), headers=headers)
    assert resp.status_code == 201
    data = resp.json()
    assert data["visitor_name"] == "Jane Visitor"
    assert "qr_token" in data
    assert "invite_link" in data


async def test_list_invites(client: AsyncClient, db: AsyncSession):
    headers = await auth_headers(client, db, "ORGANIZER")
    space   = await create_space(client, headers)
    await client.post("/invites", json=_invite_payload(space["id"]), headers=headers)
    resp = await client.get("/invites", headers=headers)
    assert resp.status_code == 200
    assert resp.json()["total"] >= 1


async def test_get_invite_by_id(client: AsyncClient, db: AsyncSession):
    headers = await auth_headers(client, db, "ORGANIZER")
    space   = await create_space(client, headers)
    created = (await client.post("/invites", json=_invite_payload(space["id"]), headers=headers)).json()
    resp = await client.get(f"/invites/{created['invite_id']}", headers=headers)
    assert resp.status_code == 200


async def test_revoke_invite(client: AsyncClient, db: AsyncSession):
    headers = await auth_headers(client, db, "ORGANIZER")
    space   = await create_space(client, headers)
    created = (await client.post("/invites", json=_invite_payload(space["id"]), headers=headers)).json()
    resp = await client.delete(f"/invites/{created['invite_id']}", headers=headers)
    assert resp.status_code == 204


async def test_invite_invalid_ownership(client: AsyncClient, db: AsyncSession):
    """Another organizer cannot access someone else's invite."""
    owner_headers = await auth_headers(client, db, "ORGANIZER")
    space   = await create_space(client, owner_headers)
    created = (await client.post("/invites", json=_invite_payload(space["id"]), headers=owner_headers)).json()

    # Register a second user — different email used in helper, override it
    other = await client.post("/auth/register", json={
        "full_name": "Other User",
        "email":     "other@example.com",
        "password":  "testpassword123",
    })
    other_headers = {"Authorization": f"Bearer {other.json()['access_token']}"}

    resp = await client.get(f"/invites/{created['invite_id']}", headers=other_headers)
    assert resp.status_code == 403
