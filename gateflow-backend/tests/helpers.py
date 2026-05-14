"""
tests/helpers.py — Shared test helper functions

These avoid copy-pasting setup code across test files.
"""
from uuid import UUID

from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from models.user import User, UserRole


async def register_and_login(
    client: AsyncClient, db: AsyncSession, role: str = "ORGANIZER",
) -> tuple[str, dict]:
    """Register a user; set role in DB when not ORGANIZER (public API never accepts role)."""
    email = f"{role.lower()}@example.com"
    reg = await client.post("/auth/register", json={
        "full_name": f"Test {role.title()}",
        "email":     email,
        "password":  "testpassword123",
    })
    assert reg.status_code == 201, reg.text
    data = reg.json()
    want = UserRole(role.upper())
    if want != UserRole.ORGANIZER:
        user = await db.get(User, UUID(data["user"]["id"]))
        assert user is not None
        user.role = want
        await db.commit()
    return data["access_token"], data["user"]


async def auth_headers(client: AsyncClient, db: AsyncSession, role: str = "ORGANIZER") -> dict:
    """Return Bearer authorization headers for a newly registered user."""
    token, _ = await register_and_login(client, db, role)
    return {"Authorization": f"Bearer {token}"}


async def create_space(client: AsyncClient, headers: dict) -> dict:
    """Create a test space and return the response JSON."""
    from datetime import datetime, timedelta, timezone
    now = datetime.now(timezone.utc)
    resp = await client.post("/spaces", json={
        "name":       "Test Space",
        "type":       "EVENT",
        "venue":      "Test Venue",
        "start_time": now.isoformat(),
        "end_time":   (now + timedelta(hours=8)).isoformat(),
        "walkin_enabled": True,
    }, headers=headers)
    assert resp.status_code == 201, resp.text
    return resp.json()
