"""controllers/space_controller.py — Space orchestration"""
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from models.user import User
from schemas.space import CreateSpaceRequest, SpaceListResponse, SpaceResponse, UpdateSpaceRequest
from services.space_service import create_space, delete_space, get_space_by_id, get_spaces, update_space


async def create(db: AsyncSession, data: CreateSpaceRequest, user: User) -> SpaceResponse:
    return await create_space(db, data, user)


async def list_spaces(db: AsyncSession, user: User) -> SpaceListResponse:
    total, spaces = await get_spaces(db, user)
    return SpaceListResponse(total=total, spaces=spaces)


async def get_one(db: AsyncSession, space_id: UUID, user: User) -> SpaceResponse:
    return await get_space_by_id(db, space_id, user)


async def update(db: AsyncSession, space_id: UUID, data: UpdateSpaceRequest, user: User) -> SpaceResponse:
    return await update_space(db, space_id, data, user)


async def delete(db: AsyncSession, space_id: UUID, user: User) -> None:
    await delete_space(db, space_id, user)
