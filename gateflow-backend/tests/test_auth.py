"""
tests/test_auth.py — Auth flow tests

Covers:
  - register a new user
  - login with valid credentials
  - login with wrong password
  - access a protected route with a valid token
  - access a protected route without a token
"""
import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio


REGISTER_PAYLOAD = {
    "full_name": "Test User",
    "email":     "test@example.com",
    "password":  "securepassword123",
    "role":      "ORGANIZER",
}


async def test_register_success(client: AsyncClient):
    response = await client.post("/auth/register", json=REGISTER_PAYLOAD)
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["role"] == "ORGANIZER"
    assert data["user"]["email"] == "test@example.com"


async def test_register_duplicate_email(client: AsyncClient):
    """Registering the same email twice must return 409."""
    await client.post("/auth/register", json=REGISTER_PAYLOAD)
    response = await client.post("/auth/register", json=REGISTER_PAYLOAD)
    assert response.status_code == 409


async def test_login_success(client: AsyncClient):
    await client.post("/auth/register", json=REGISTER_PAYLOAD)
    response = await client.post("/auth/login", json={
        "email": "test@example.com",
        "password": "securepassword123",
    })
    assert response.status_code == 200
    assert "access_token" in response.json()


async def test_login_wrong_password(client: AsyncClient):
    await client.post("/auth/register", json=REGISTER_PAYLOAD)
    response = await client.post("/auth/login", json={
        "email": "test@example.com",
        "password": "wrongpassword",
    })
    assert response.status_code == 401


async def test_login_unknown_email(client: AsyncClient):
    response = await client.post("/auth/login", json={
        "email": "nobody@example.com",
        "password": "anypassword",
    })
    assert response.status_code == 401


async def test_me_with_valid_token(client: AsyncClient):
    reg = await client.post("/auth/register", json=REGISTER_PAYLOAD)
    token = reg.json()["access_token"]
    response = await client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert response.json()["email"] == "test@example.com"


async def test_me_without_token(client: AsyncClient):
    """Protected route must return 401 when no token is provided."""
    response = await client.get("/auth/me")
    assert response.status_code == 401


async def test_refresh_token(client: AsyncClient):
    reg = await client.post("/auth/register", json=REGISTER_PAYLOAD)
    refresh_token = reg.json()["refresh_token"]
    response = await client.post("/auth/refresh", json={"refresh_token": refresh_token})
    assert response.status_code == 200
    assert "access_token" in response.json()
