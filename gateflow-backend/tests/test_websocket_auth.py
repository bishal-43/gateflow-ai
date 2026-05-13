"""
tests/test_websocket_auth.py — WebSocket dashboard auth (Starlette TestClient).

No query token → connection rejected.
Invalid JWT → rejected before subscribe.
Valid token + owned space → handshake succeeds.
Wrong space (other organizer) → rejected.
"""
from urllib.parse import quote
from uuid import uuid4

import pytest
from starlette.testclient import TestClient


@pytest.fixture(scope="module")
def ws_client():
    from main import app

    with TestClient(app) as client:
        yield client


def test_ws_rejects_without_token(ws_client):
    sid = uuid4()
    with pytest.raises(Exception):
        with ws_client.websocket_connect(f"/ws/dashboard/{sid}"):
            pass


def test_ws_rejects_invalid_jwt(ws_client):
    sid = uuid4()
    bad = quote("not.a.valid.jwt")
    with pytest.raises(Exception):
        with ws_client.websocket_connect(f"/ws/dashboard/{sid}?token={bad}"):
            pass


def test_ws_accepts_owner_and_rejects_other_organizer(ws_client):
    # HTTP via TestClient uses same app + DB as configured in .env
    reg = ws_client.post(
        "/auth/register",
        json={
            "full_name": "WS Owner",
            "email": f"wsowner_{uuid4().hex[:8]}@example.com",
            "password": "testpassword123",
        },
    )
    assert reg.status_code == 201, reg.text
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    from datetime import datetime, timedelta, timezone

    now = datetime.now(timezone.utc).isoformat()
    end = (datetime.now(timezone.utc) + timedelta(hours=8)).isoformat()
    sp = ws_client.post(
        "/spaces",
        json={
            "name": "WS Test Space",
            "type": "EVENT",
            "venue": "Hall",
            "start_time": now,
            "end_time": end,
            "walkin_enabled": True,
        },
        headers=headers,
    )
    assert sp.status_code == 201, sp.text
    space_id = sp.json()["id"]

    enc = quote(token)
    with ws_client.websocket_connect(f"/ws/dashboard/{space_id}?token={enc}") as ws:
        ws.close()

    other = ws_client.post(
        "/auth/register",
        json={
            "full_name": "WS Intruder",
            "email": f"wsintr_{uuid4().hex[:8]}@example.com",
            "password": "testpassword123",
        },
    )
    assert other.status_code == 201, other.text
    bad_token = quote(other.json()["access_token"])
    with pytest.raises(Exception):
        with ws_client.websocket_connect(f"/ws/dashboard/{space_id}?token={bad_token}"):
            pass
