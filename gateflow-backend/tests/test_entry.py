"""
tests/test_entry.py — QR Entry flow tests

Covers:
  - valid QR scan → entry allowed
  - duplicate QR scan → rejected
  - expired QR → rejected
  - revoked invite QR → rejected
  - wrong role (ORGANIZER trying to scan) → 403
"""
import pytest
from datetime import datetime, timedelta, timezone
from httpx import AsyncClient
from tests.helpers import auth_headers, create_space

pytestmark = pytest.mark.asyncio


async def _create_invite(client, headers, space_id, valid_from=None, valid_until=None):
    now = datetime.now(timezone.utc)
    resp = await client.post("/invites", json={
        "space_id":     space_id,
        "visitor_name": "QR Visitor",
        "invite_type":  "EVENT_GUEST",
        "valid_from":   (valid_from or now).isoformat(),
        "valid_until":  (valid_until or (now + timedelta(hours=4))).isoformat(),
    }, headers=headers)
    assert resp.status_code == 201, resp.text
    return resp.json()


async def test_valid_entry_scan(client: AsyncClient):
    org_headers   = await auth_headers(client, "ORGANIZER")
    guard_headers = await auth_headers(client, "GUARD")
    space   = await create_space(client, org_headers)
    invite  = await _create_invite(client, org_headers, space["id"])

    resp = await client.post("/entry/scan", json={
        "qr_token": invite["qr_token"],
        "gate_id":  "GATE-A",
    }, headers=guard_headers)
    assert resp.status_code == 200
    assert resp.json()["status"] == "ALLOWED"


async def test_duplicate_entry_scan(client: AsyncClient):
    """Scanning the same QR twice must be rejected."""
    org_headers   = await auth_headers(client, "ORGANIZER")
    guard_headers = await auth_headers(client, "GUARD")
    space  = await create_space(client, org_headers)
    invite = await _create_invite(client, org_headers, space["id"])

    await client.post("/entry/scan", json={"qr_token": invite["qr_token"]}, headers=guard_headers)
    resp = await client.post("/entry/scan", json={"qr_token": invite["qr_token"]}, headers=guard_headers)
    assert resp.status_code == 400


async def test_expired_qr_scan(client: AsyncClient):
    """A QR whose valid_until is in the past must be rejected."""
    org_headers   = await auth_headers(client, "ORGANIZER")
    guard_headers = await auth_headers(client, "GUARD")
    space  = await create_space(client, org_headers)

    past = datetime.now(timezone.utc) - timedelta(hours=2)
    invite = await _create_invite(
        client, org_headers, space["id"],
        valid_from=past - timedelta(hours=1),
        valid_until=past,
    )

    resp = await client.post("/entry/scan", json={"qr_token": invite["qr_token"]}, headers=guard_headers)
    assert resp.status_code == 400


async def test_revoked_qr_scan(client: AsyncClient):
    """Revoking an invite must prevent entry scan."""
    org_headers   = await auth_headers(client, "ORGANIZER")
    guard_headers = await auth_headers(client, "GUARD")
    space  = await create_space(client, org_headers)
    invite = await _create_invite(client, org_headers, space["id"])

    await client.delete(f"/invites/{invite['invite_id']}", headers=org_headers)

    resp = await client.post("/entry/scan", json={"qr_token": invite["qr_token"]}, headers=guard_headers)
    assert resp.status_code == 400


async def test_wrong_role_cannot_scan(client: AsyncClient):
    """ORGANIZER role must not be able to scan entry (GUARD/ADMIN only)."""
    org_headers = await auth_headers(client, "ORGANIZER")
    space  = await create_space(client, org_headers)
    invite = await _create_invite(client, org_headers, space["id"])

    resp = await client.post("/entry/scan", json={"qr_token": invite["qr_token"]}, headers=org_headers)
    assert resp.status_code == 403
