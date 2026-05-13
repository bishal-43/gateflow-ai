"""routes/auth_routes.py — Auth endpoints"""
from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession

import controllers.auth_controller as ctrl
from database import get_db
from dependencies import get_current_user
from models.user import User
from schemas.auth import LoginRequest, LogoutRequest, MessageResponse, RefreshRequest, RegisterRequest, TokenResponse, UserResponse
from schemas.common import ErrorResponse
from utils.rate_limiter import limiter

router = APIRouter()


@router.post(
    "/register", response_model=TokenResponse, status_code=201,
    summary="Register a new user",
    responses={409: {"model": ErrorResponse, "description": "Email already registered"}},
)
async def register(data: RegisterRequest, db: AsyncSession = Depends(get_db)):
    return await ctrl.register(db, data)


@router.post(
    "/login", response_model=TokenResponse,
    summary="Login with email and password",
    responses={401: {"model": ErrorResponse, "description": "Invalid credentials"}},
)
@limiter.limit("10/minute")
async def login(request: Request, data: LoginRequest, db: AsyncSession = Depends(get_db)):
    return await ctrl.login(db, data)


@router.post(
    "/logout", response_model=MessageResponse,
    summary="Logout — revokes both access and refresh tokens",
)
async def logout(
    data: LogoutRequest,
    authorization: str = Header(..., alias="Authorization"),
    _: User = Depends(get_current_user),
):
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid Authorization header")
    await ctrl.logout(parts[1], data.refresh_token)
    return MessageResponse(message="Logged out successfully")


@router.post(
    "/refresh", response_model=TokenResponse,
    summary="Exchange refresh token for new access + refresh tokens",
    responses={401: {"model": ErrorResponse, "description": "Invalid or expired refresh token"}},
)
async def refresh(data: RefreshRequest, db: AsyncSession = Depends(get_db)):
    return await ctrl.refresh(db, data)


@router.get(
    "/me", response_model=UserResponse,
    summary="Get current authenticated user profile",
)
async def me(current_user: User = Depends(get_current_user)):
    return ctrl.get_me(current_user)


@router.get("/google", response_class=RedirectResponse, status_code=302, summary="Start Google OAuth2 login")
async def google_login():
    return RedirectResponse(url=await ctrl.google_url(), status_code=302)


@router.get("/google/callback", response_model=TokenResponse, summary="Google OAuth2 callback — handled automatically")
async def google_callback(code: str, state: str, db: AsyncSession = Depends(get_db)):
    return await ctrl.google_login(db, code, state)
