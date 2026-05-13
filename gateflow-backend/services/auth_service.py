"""services/auth_service.py — Auth business logic"""
import secrets
from datetime import datetime, timezone
from typing import Any
from uuid import UUID

import httpx
from fastapi import HTTPException, status
from jose import JWTError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from config import settings
from security import blacklist_token, create_access_token, create_refresh_token, decode_token, hash_password, is_token_blacklisted, verify_password
from models.user import AuthProvider, User, UserRole
from schemas.auth import TokenResponse, UserResponse
from utils.logger import logger
from utils.redis_client import redis_client

GOOGLE_AUTH_URL    = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL   = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"
_OAUTH_STATE_PREFIX = "oauth:state:"
_OAUTH_STATE_TTL    = 600


def _make_tokens(user: User) -> TokenResponse:
    access_token, _  = create_access_token(str(user.id), user.role.value)
    refresh_token, _ = create_refresh_token(str(user.id))
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        role=user.role.value,
        user=UserResponse(
            id=str(user.id), email=user.email, full_name=user.full_name,
            role=user.role.value, auth_provider=user.auth_provider.value,
            avatar_url=user.avatar_url, is_active=user.is_active, is_verified=user.is_verified,
        ),
    )


def _ttl(payload: dict[str, Any]) -> int:
    return max(int(payload.get("exp", 0) - datetime.now(timezone.utc).timestamp()), 1)


async def _by_email(db: AsyncSession, email: str) -> User | None:
    r = await db.execute(select(User).where(User.email == email))
    return r.scalar_one_or_none()


async def _by_google_id(db: AsyncSession, gid: str) -> User | None:
    r = await db.execute(select(User).where(User.google_id == gid))
    return r.scalar_one_or_none()


async def register_user(db: AsyncSession, full_name: str, email: str, password: str, role: str = "ORGANIZER") -> TokenResponse:
    email = email.lower().strip()
    if await _by_email(db, email):
        raise HTTPException(status.HTTP_409_CONFLICT, "Email already registered")
    user = User(email=email, full_name=full_name.strip(), hashed_password=hash_password(password),
                role=UserRole(role.upper()), auth_provider=AuthProvider.EMAIL, is_verified=False)
    db.add(user)
    await db.commit()
    await db.refresh(user)
    logger.info(f"[AUTH] Registered: {user.email}")
    return _make_tokens(user)


async def login_user(db: AsyncSession, email: str, password: str) -> TokenResponse:
    email = email.lower().strip()
    user = await _by_email(db, email)
    if not user or not user.hashed_password or not verify_password(password, user.hashed_password):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid email or password")
    if not user.is_active:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Account is deactivated")
    logger.info(f"[AUTH] Login: {user.email}")
    return _make_tokens(user)


async def logout_user(access_token: str, refresh_token: str) -> None:
    for token in [access_token, refresh_token]:
        try:
            p = decode_token(token)
            jti = p.get("jti")
            if jti:
                await blacklist_token(jti, _ttl(p))
        except JWTError:
            pass
    logger.info("[AUTH] Logout complete")


async def refresh_tokens(db: AsyncSession, refresh_token: str) -> TokenResponse:
    try:
        payload = decode_token(refresh_token)
    except JWTError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired refresh token")
    if payload.get("type") != "refresh":
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Not a refresh token")
    jti = payload.get("jti")
    user_id = payload.get("sub")
    if not jti or not user_id:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Malformed token")
    if await is_token_blacklisted(jti):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Refresh token already used")
    try:
        uid = UUID(str(user_id))
    except ValueError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Malformed token")
    user = await db.get(User, uid)
    if not user or not user.is_active:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "User not found")
    await blacklist_token(jti, _ttl(payload))
    return _make_tokens(user)


async def build_google_auth_url() -> str:
    state = secrets.token_urlsafe(32)
    await redis_client.setex(f"{_OAUTH_STATE_PREFIX}{state}", _OAUTH_STATE_TTL, "1")
    return (f"{GOOGLE_AUTH_URL}?client_id={settings.GOOGLE_CLIENT_ID}"
            f"&redirect_uri={settings.GOOGLE_REDIRECT_URI}&response_type=code"
            f"&scope=openid%20email%20profile&access_type=offline&prompt=consent&state={state}")


async def google_callback(db: AsyncSession, code: str, state: str) -> TokenResponse:
    key = f"{_OAUTH_STATE_PREFIX}{state}"
    if not await redis_client.exists(key):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid OAuth state")
    await redis_client.delete(key)

    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.post(GOOGLE_TOKEN_URL, data={"code": code, "client_id": settings.GOOGLE_CLIENT_ID,
            "client_secret": settings.GOOGLE_CLIENT_SECRET, "redirect_uri": settings.GOOGLE_REDIRECT_URI,
            "grant_type": "authorization_code"})
    if r.status_code != 200:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Google token exchange failed")
    g_token = r.json().get("access_token")

    async with httpx.AsyncClient(timeout=10) as client:
        r2 = await client.get(GOOGLE_USERINFO_URL, headers={"Authorization": f"Bearer {g_token}"})
    if r2.status_code != 200:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Failed to fetch Google profile")
    profile = r2.json()

    email = profile.get("email", "").lower().strip()
    if not email:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Google account has no email")

    user = await _by_google_id(db, profile.get("id", "")) or await _by_email(db, email)
    if user:
        user.google_id = profile.get("id"); user.avatar_url = profile.get("picture")
        user.auth_provider = AuthProvider.GOOGLE; user.is_verified = True
    else:
        user = User(email=email, full_name=profile.get("name", "Unknown"), hashed_password=None,
                    role=UserRole.ORGANIZER, auth_provider=AuthProvider.GOOGLE,
                    google_id=profile.get("id"), avatar_url=profile.get("picture"), is_verified=True)
        db.add(user)
    await db.commit()
    await db.refresh(user)
    return _make_tokens(user)


def user_to_response(user: User) -> UserResponse:
    return UserResponse(id=str(user.id), email=user.email, full_name=user.full_name,
                        role=user.role.value, auth_provider=user.auth_provider.value,
                        avatar_url=user.avatar_url, is_active=user.is_active, is_verified=user.is_verified)
