"""
dependencies.py — FastAPI reusable dependencies (auth + RBAC)
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from database import get_db
from models.user import User
from security import decode_token, is_token_blacklisted

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


async def user_from_access_token(db: AsyncSession, token: str) -> User:
    """
    Validate a raw access JWT (e.g. WebSocket ?token=...) and return the User.
    Same rules as HTTP Bearer auth: access type only, blacklist check, active user.
    """
    credentials_exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = decode_token(token)
    except JWTError:
        raise credentials_exc

    user_id: str | None = payload.get("sub")
    token_type: str | None = payload.get("type")
    jti: str | None = payload.get("jti")

    if not user_id or not jti:
        raise credentials_exc

    if token_type != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Use your access token, not a refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if await is_token_blacklisted(jti):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has been revoked — please log in again",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        uid = UUID(user_id)
    except ValueError:
        raise credentials_exc

    user = await db.get(User, uid)

    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Account is deactivated")

    return user


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
):
    """Validate Bearer JWT and return the authenticated User."""
    return await user_from_access_token(db, token)


def require_roles(*roles: str):
    """RBAC dependency factory. Usage: Depends(require_roles('GUARD', 'ADMIN'))"""
    async def _check(current_user=Depends(get_current_user)):
        if current_user.role.value not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required: {list(roles)}",
            )
        return current_user
    return _check
