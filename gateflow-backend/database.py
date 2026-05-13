"""
database.py — Async SQLAlchemy engine, session, and Base
"""
from collections.abc import AsyncGenerator
from typing import Any
from urllib.parse import parse_qs, unquote, urlparse, urlunparse

from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase

from config import settings


def _build_engine() -> AsyncEngine:
    """Build async engine. Handles Neon SSL and URL-encoded DB names."""
    raw_url = settings.DATABASE_URL
    connect_args: dict = {}

    parsed = urlparse(raw_url)
    query_params = parse_qs(parsed.query)

    if bool({"ssl", "sslmode"} & set(query_params.keys())) or "neon.tech" in raw_url:
        connect_args["ssl"] = "require"

    clean_url = urlunparse(parsed._replace(query="", path=unquote(parsed.path)))

    return create_async_engine(
        clean_url,
        echo=settings.DEBUG,
        pool_pre_ping=True,
        pool_size=5,
        max_overflow=10,
        connect_args=connect_args,
    )


engine: AsyncEngine = _build_engine()

AsyncSessionLocal: async_sessionmaker[AsyncSession] = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False,
)


class Base(DeclarativeBase):
    """All ORM models inherit from this."""
    pass


async def get_db() -> AsyncGenerator[AsyncSession, Any]:
    """FastAPI dependency — one DB session per request."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


def get_db_context():
    """
    Plain async context manager for background tasks (e.g. APScheduler jobs).
    Use as:  async with get_db_context() as db:
    Unlike get_db(), this does NOT need FastAPI's DI system.
    """
    return AsyncSessionLocal()


async def create_tables() -> None:
    """Create all DB tables on startup. Safe to run repeatedly."""
    import models  # noqa: F401 — registers all models with Base.metadata
    from utils.logger import logger
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("[OK] Database tables created / verified")
    except Exception as e:
        logger.error(f"[FAIL] DB table creation failed: {e}")
        raise
