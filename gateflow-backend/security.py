"""
security.py — Password hashing, JWT creation/decoding, token blacklist
"""
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any

import bcrypt
from jose import JWTError, jwt

from config import settings

_BLACKLIST_PREFIX = "token:blacklist:"


# ── Passwords ─────────────────────────────────────────────────────────────────

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


# ── JWT ───────────────────────────────────────────────────────────────────────

def decode_token(token: str) -> dict[str, Any]:
    """Decode JWT. Raises JWTError if invalid or expired."""
    return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])


def decode_token_safe(token: str) -> dict[str, Any] | None:
    """Decode JWT without raising. Returns None on failure."""
    try:
        return decode_token(token)
    except JWTError:
        return None


def create_access_token(user_id: str, role: str) -> tuple[str, str]:
    """Returns (token, jti). Short-lived access token."""
    jti = str(uuid.uuid4())
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {"sub": user_id, "role": role, "type": "access", "jti": jti, "exp": expire}
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM), jti


def create_refresh_token(user_id: str) -> tuple[str, str]:
    """Returns (token, jti). Long-lived refresh token."""
    jti = str(uuid.uuid4())
    expire = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    payload = {"sub": user_id, "type": "refresh", "jti": jti, "exp": expire}
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM), jti


# ── Redis blacklist ───────────────────────────────────────────────────────────

async def blacklist_token(jti: str, expires_in_seconds: int) -> None:
    """Add token jti to Redis blacklist. Auto-expires with the token."""
    from utils.redis_client import redis_client
    await redis_client.setex(f"{_BLACKLIST_PREFIX}{jti}", expires_in_seconds, "1")


async def is_token_blacklisted(jti: str) -> bool:
    """Return True if this token has been revoked."""
    from utils.redis_client import redis_client
    return bool(await redis_client.exists(f"{_BLACKLIST_PREFIX}{jti}"))
