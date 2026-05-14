"""
tests/test_dashboard_idor.py — Cross-tenant / IDOR checks on dashboard and occupancy APIs.
"""
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from tests.helpers import auth_headers, create_space

pytestmark = pytest.mark.asyncio


async def test_dashboard_stats_forbidden_other_organizer_space(client: AsyncClient, db: AsyncSession):
    owner_h = await auth_headers(client, db, "ORGANIZER")
    space = await create_space(client, owner_h)

    other = await client.post(
        "/auth/register",
        json={
            "full_name": "Other Org",
            "email": "otherorg99@example.com",
            "password": "testpassword123",
        },
    )
    assert other.status_code == 201, other.text
    other_token = other.json()["access_token"]
    other_headers = {"Authorization": f"Bearer {other_token}"}

    r = await client.get(f"/dashboard/stats?space_id={space['id']}", headers=other_headers)
    assert r.status_code == 403


async def test_dashboard_occupancy_forbidden_cross_tenant(client: AsyncClient, db: AsyncSession):
    owner_h = await auth_headers(client, db, "ORGANIZER")
    space = await create_space(client, owner_h)

    other = await client.post(
        "/auth/register",
        json={
            "full_name": "Other Org 2",
            "email": "otherorg98@example.com",
            "password": "testpassword123",
        },
    )
    other_headers = {"Authorization": f"Bearer {other.json()['access_token']}"}

    r = await client.get(f"/dashboard/occupancy?space_id={space['id']}", headers=other_headers)
    assert r.status_code == 403


async def test_exit_occupancy_owner_ok(client: AsyncClient, db: AsyncSession):
    owner_h = await auth_headers(client, db, "ORGANIZER")
    space = await create_space(client, owner_h)
    r = await client.get(f"/exit/occupancy?space_id={space['id']}", headers=owner_h)
    assert r.status_code == 200
    data = r.json()
    assert data["space_id"] == space["id"]
    assert "inside" in data and "exited" in data


async def test_entry_active_forbidden_cross_tenant(client: AsyncClient, db: AsyncSession):
    owner_h = await auth_headers(client, db, "ORGANIZER")
    space = await create_space(client, owner_h)

    other = await client.post(
        "/auth/register",
        json={
            "full_name": "Other Org 3",
            "email": "otherorg97@example.com",
            "password": "testpassword123",
        },
    )
    other_headers = {"Authorization": f"Bearer {other.json()['access_token']}"}

    r = await client.get(f"/entry/active?space_id={space['id']}", headers=other_headers)
    assert r.status_code == 403
