"""utils/logger.py — Loguru logging setup"""
import sys
from pathlib import Path
from loguru import logger
from config import settings


def configure_logging() -> None:
    logger.remove()
    level = "DEBUG" if settings.is_development else "INFO"

    logger.add(
        sys.stdout,
        level=level,
        format=(
            "<green>{time:YYYY-MM-DD HH:mm:ss}</green> | "
            "<level>{level: <8}</level> | "
            "<cyan>{name}</cyan>:<cyan>{line}</cyan> | "
            "<level>{message}</level>"
        ),
        colorize=not settings.is_production,
        backtrace=settings.is_development,
        diagnose=False,
    )

    log_dir = Path("logs")
    log_dir.mkdir(exist_ok=True)
    logger.add(
        log_dir / "gateflow_{time:YYYY-MM-DD}.log",
        level="INFO",
        rotation="00:00",
        retention="30 days",
        compression="zip",
        enqueue=True,
        diagnose=False,
    )
    logger.info(f"[OK] Logging ready | env={settings.APP_ENV} | level={level}")


__all__ = ["logger", "configure_logging"]
