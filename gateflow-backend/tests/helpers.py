"""
tests/helpers.py — Shared test helper functions

These avoid copy-pasting setup code across test files.
"""
from httpx import AsyncClient


async def register_and_login(client: AsyncClient, role: str = "ORGANIZER") -> tuple[str, dict]:
    """Register a user with the given role and return (access_token, user_data)."""
    email = f"{role.lower()}@example.com"
    reg = await client.post("/auth/register", json={
        "full_name": f"Test {role.title()}",
        "email":     email,
        "password":  "testpassword123",
        "role":      role,
    })
    assert reg.status_code == 201, reg.text
    data = reg.json()
    return data["access_token"], data["user"]


async def auth_headers(client: AsyncClient, role: str = "ORGANIZER") -> dict:
    """Return Bearer authorization headers for a newly registered user."""
    token, _ = await register_and_login(client, role)
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
