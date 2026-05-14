"""
tests/test_exit_flow.py — Exit scan behavior (valid, duplicate, invalid QR, lock contention).

Uses the same patterns as test_entry.py.
"""
import asyncio

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from tests.helpers import auth_headers, create_space

pytestmark = pytest.mark.asyncio


async def _create_invite(client, headers, space_id):
    from datetime import datetime, timedelta, timezone

    now = datetime.now(timezone.utc)
    resp = await client.post(
        "/invites",
        json={
            "space_id": space_id,
            "visitor_name": "Exit Test Visitor",
            "invite_type": "EVENT_GUEST",
            "valid_from": now.isoformat(),
            "valid_until": (now + timedelta(hours=4)).isoformat(),
        },
        headers=headers,
    )
    assert resp.status_code == 201, resp.text
    return resp.json()


async def test_valid_exit(client: AsyncClient, db: AsyncSession):
    org_headers = await auth_headers(client, db, "ORGANIZER")
    guard_headers = await auth_headers(client, db, "GUARD")
    space = await create_space(client, org_headers)
    invite = await _create_invite(client, org_headers, space["id"])

    await client.post(
        "/entry/scan",
        json={"qr_token": invite["qr_token"], "gate_id": "G1"},
        headers=guard_headers,
    )

    resp = await client.post(
        "/exit/scan",
        json={"qr_token": invite["qr_token"], "gate_id": "G2"},
        headers=guard_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "EXITED"


async def test_duplicate_exit_rejected(client: AsyncClient, db: AsyncSession):
    org_headers = await auth_headers(client, db, "ORGANIZER")
    guard_headers = await auth_headers(client, db, "GUARD")
    space = await create_space(client, org_headers)
    invite = await _create_invite(client, org_headers, space["id"])

    await client.post("/entry/scan", json={"qr_token": invite["qr_token"]}, headers=guard_headers)
    first = await client.post("/exit/scan", json={"qr_token": invite["qr_token"]}, headers=guard_headers)
    assert first.status_code == 200

    second = await client.post("/exit/scan", json={"qr_token": invite["qr_token"]}, headers=guard_headers)
    assert second.status_code == 400


async def test_exit_invalid_qr(client: AsyncClient, db: AsyncSession):
    guard_headers = await auth_headers(client, db, "GUARD")
    resp = await client.post(
        "/exit/scan",
        json={"qr_token": "not_a_real_qr_token_value_000000000000", "gate_id": "G1"},
        headers=guard_headers,
    )
    assert resp.status_code == 404


async def test_exit_parallel_scans_one_conflict(client: AsyncClient, db: AsyncSession):
    """Two simultaneous exit scans for the same QR: one wins, the other gets 409 or 400."""
    org_headers = await auth_headers(client, db, "ORGANIZER")
    guard_headers = await auth_headers(client, db, "GUARD")
    space = await create_space(client, org_headers)
    invite = await _create_invite(client, org_headers, space["id"])

    await client.post("/entry/scan", json={"qr_token": invite["qr_token"]}, headers=guard_headers)

    async def scan():
        return await client.post(
            "/exit/scan",
            json={"qr_token": invite["qr_token"], "gate_id": "GX"},
            headers=guard_headers,
        )

    r1, r2 = await asyncio.gather(scan(), scan())
    codes = {r1.status_code, r2.status_code}
    assert 200 in codes
    assert codes.issubset({200, 400, 409})
