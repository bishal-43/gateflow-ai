"""utils/redis_client.py — Async Redis singleton"""
import os
import time
from dataclasses import dataclass
from typing import Any
import sys

import redis.asyncio as aioredis
from redis.asyncio import Redis
from config import settings


@dataclass
class _MemValue:
    value: Any
    expires_at: float | None = None


class InMemoryRedis:
    """
    Tiny async Redis-like stub used for tests.

    Supports only the commands we use in this project:
    ping, setex, exists, delete, set(nx, ex).
    """

    def __init__(self) -> None:
        self._store: dict[str, _MemValue] = {}

    def _now(self) -> float:
        return time.time()

    def _cleanup(self, key: str) -> None:
        v = self._store.get(key)
        if v and v.expires_at is not None and v.expires_at <= self._now():
            self._store.pop(key, None)

    async def ping(self) -> bool:
        return True

    async def setex(self, key: str, ttl_seconds: int, value: Any) -> bool:
        self._store[key] = _MemValue(value=value, expires_at=self._now() + int(ttl_seconds))
        return True

    async def exists(self, key: str) -> int:
        self._cleanup(key)
        return 1 if key in self._store else 0

    async def delete(self, key: str) -> int:
        existed = int(key in self._store)
        self._store.pop(key, None)
        return existed

    async def set(self, key: str, value: Any, nx: bool = False, ex: int | None = None) -> str | None:
        self._cleanup(key)
        if nx and key in self._store:
            return None
        expires_at = None if ex is None else (self._now() + int(ex))
        self._store[key] = _MemValue(value=value, expires_at=expires_at)
        return "OK"


def _create() -> Redis:
    return aioredis.from_url(
        settings.REDIS_URL,
        decode_responses=True,
        socket_connect_timeout=5,
        socket_timeout=5,
    )


_IS_TEST = ("pytest" in sys.modules) or bool(os.getenv("PYTEST_CURRENT_TEST")) or settings.APP_ENV.lower() == "test"
redis_client: Redis | InMemoryRedis = InMemoryRedis() if _IS_TEST else _create()


async def ping_redis() -> bool:
    from utils.logger import logger
    try:
        await redis_client.ping()
        logger.info("[OK] Redis connected")
        return True
    except Exception as e:
        logger.warning(f"[WARN] Redis failed: {e}")
        return False
