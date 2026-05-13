"""services/space_service.py — Space business logic"""
from uuid import UUID
from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from models.space import Space, SpaceType
from models.user import User, UserRole
from schemas.space import CreateSpaceRequest, SpaceResponse, UpdateSpaceRequest
from utils.logger import logger


def _to_resp(space: Space) -> SpaceResponse:
    return SpaceResponse.model_validate(space)


async def _get_space(db: AsyncSession, space_id: UUID, user: User) -> Space:
    space = await db.get(Space, space_id)
    if space is None or not space.is_active:
        raise HTTPException(status.HTTP_404_NOT_FOUND, f"Space {space_id} not found")
    if user.role != UserRole.ADMIN and space.owner_id != user.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "You do not own this space")
    return space


async def ensure_space_access(db: AsyncSession, space_id: UUID, user: User) -> Space:
    """
    IDOR guard for any API scoped by space_id.

    ADMIN may access any active space. ORGANIZER / RESIDENT / GUARD must own the space.
    """
    return await _get_space(db, space_id, user)


async def create_space(db: AsyncSession, data: CreateSpaceRequest, user: User) -> SpaceResponse:
    space = Space(owner_id=user.id, type=data.type, name=data.name, venue=data.venue,
                  start_time=data.start_time, end_time=data.end_time, address=data.address,
                  walkin_enabled=data.walkin_enabled, max_guests=data.max_guests, is_active=True)
    db.add(space)
    await db.commit()
    await db.refresh(space)
    logger.info(f"[SPACE] Created: {space.name!r} by {user.email}")
    return _to_resp(space)


async def get_spaces(db: AsyncSession, user: User) -> tuple[int, list[SpaceResponse]]:
    filters = [Space.is_active == True]  # noqa: E712
    if user.role != UserRole.ADMIN:
        filters.append(Space.owner_id == user.id)
    total = (await db.execute(select(func.count()).select_from(Space).where(*filters))).scalar_one()
    rows = (await db.execute(select(Space).where(*filters).order_by(Space.created_at.desc()))).scalars().all()
    return total, [_to_resp(s) for s in rows]


async def get_space_by_id(db: AsyncSession, space_id: UUID, user: User) -> SpaceResponse:
    return _to_resp(await _get_space(db, space_id, user))


async def update_space(db: AsyncSession, space_id: UUID, data: UpdateSpaceRequest, user: User) -> SpaceResponse:
    space = await _get_space(db, space_id, user)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(space, field, value)
    if space.type == SpaceType.EVENT and space.start_time and space.end_time:
        if space.end_time <= space.start_time:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "end_time must be after start_time")
    await db.commit()
    await db.refresh(space)
    return _to_resp(space)


async def delete_space(db: AsyncSession, space_id: UUID, user: User) -> None:
    space = await _get_space(db, space_id, user)
    space.is_active = False
    await db.commit()
    logger.info(f"[SPACE] Deleted: {space.name!r} by {user.email}")
