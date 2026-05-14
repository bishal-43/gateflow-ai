"""routes/space_routes.py — Space endpoints only"""
from uuid import UUID
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
import controllers.space_controller as ctrl
from database import get_db
from dependencies import require_roles
from models.user import User
from schemas.space import CreateSpaceRequest, SpaceListResponse, SpaceResponse, UpdateSpaceRequest

router = APIRouter()
_ROLES = ("ORGANIZER", "RESIDENT", "ADMIN")


@router.post("", response_model=SpaceResponse, status_code=201)
async def create(data: CreateSpaceRequest, db: AsyncSession = Depends(get_db), user: User = Depends(require_roles(*_ROLES))):
    return await ctrl.create(db, data, user)


@router.get("", response_model=SpaceListResponse)
async def list_spaces(db: AsyncSession = Depends(get_db), user: User = Depends(require_roles(*_ROLES))):
    return await ctrl.list_spaces(db, user)


@router.get("/{space_id}", response_model=SpaceResponse)
async def get_one(space_id: UUID, db: AsyncSession = Depends(get_db), user: User = Depends(require_roles(*_ROLES))):
    return await ctrl.get_one(db, space_id, user)


@router.put("/{space_id}", response_model=SpaceResponse)
async def update(space_id: UUID, data: UpdateSpaceRequest, db: AsyncSession = Depends(get_db), user: User = Depends(require_roles(*_ROLES))):
    return await ctrl.update(db, space_id, data, user)


@router.delete("/{space_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete(space_id: UUID, db: AsyncSession = Depends(get_db), user: User = Depends(require_roles(*_ROLES))):
    await ctrl.delete(db, space_id, user)
