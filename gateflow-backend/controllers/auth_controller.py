"""controllers/auth_controller.py — Auth orchestration"""
from sqlalchemy.ext.asyncio import AsyncSession
from models.user import User
from schemas.auth import LoginRequest, LogoutRequest, RefreshRequest, RegisterRequest, TokenResponse, UserResponse
from services.auth_service import build_google_auth_url, google_callback, login_user, logout_user, refresh_tokens, register_user, user_to_response


async def register(db: AsyncSession, data: RegisterRequest) -> TokenResponse:
    return await register_user(db, data.full_name, data.email, data.password, data.role)


async def login(db: AsyncSession, data: LoginRequest) -> TokenResponse:
    return await login_user(db, data.email, data.password)


async def logout(access_token: str, refresh_token: str) -> None:
    await logout_user(access_token, refresh_token)


async def refresh(db: AsyncSession, data: RefreshRequest) -> TokenResponse:
    return await refresh_tokens(db, data.refresh_token)


def get_me(user: User) -> UserResponse:
    return user_to_response(user)


async def google_url() -> str:
    return await build_google_auth_url()


async def google_login(db: AsyncSession, code: str, state: str) -> TokenResponse:
    return await google_callback(db, code, state)
