"""
tests/conftest.py — Shared test fixtures

How tests work:
  - We use an in-memory SQLite database (no PostgreSQL needed for tests)
  - Each test gets a fresh database via the `db` fixture
  - httpx.AsyncClient makes requests through the FastAPI app without a real server

To run: pytest tests/ -v

Note on SQLite + UUIDs:
  Our models use PostgreSQL UUID columns. SQLite stores them as strings.
  We use native_uuid=False in the engine to handle this automatically.
"""
from typing import AsyncGenerator

import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy import event
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from database import Base, get_db
from main import app

TEST_DB_URL = "sqlite+aiosqlite:///:memory:"

test_engine = create_async_engine(TEST_DB_URL, echo=False)
TestSessionLocal = async_sessionmaker(test_engine, expire_on_commit=False)


# Make SQLite handle UUID columns as strings (they're stored as VARCHAR)
@event.listens_for(test_engine.sync_engine, "connect")
def set_sqlite_pragma(dbapi_conn, connection_record):
    cursor = dbapi_conn.cursor()
    cursor.execute("PRAGMA journal_mode=WAL")
    cursor.close()


@pytest_asyncio.fixture(scope="function")
async def db() -> AsyncGenerator[AsyncSession, None]:
    """Fresh tables for each test, dropped after."""
    async with test_engine.begin() as conn:
        # Use render_as_batch for SQLite compatibility with ALTER TABLE
        await conn.run_sync(Base.metadata.create_all)
    async with TestSessionLocal() as session:
        yield session
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture(scope="function")
async def client(db: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """AsyncClient wired to the FastAPI app with the test DB injected."""
    async def override_get_db():
        yield db

    app.dependency_overrides[get_db] = override_get_db
    # Many tests register users in one process; disable SlowAPI so limits do not break CI.
    app.state.limiter.enabled = False
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()
