"""
main.py — GateFlow AI entry point

Start: uvicorn main:app --reload
Docs:  http://localhost:8000/docs
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi.errors import RateLimitExceeded
from apscheduler.schedulers.asyncio import AsyncIOScheduler

from config import settings
from database import create_tables, engine
from utils.logger import configure_logging, logger
from utils.rate_limiter import _rate_limit_exceeded_handler, limiter
from utils.redis_client import ping_redis


# ── Scheduler ─────────────────────────────────────────────────────────────────
scheduler = AsyncIOScheduler()


@asynccontextmanager
async def lifespan(app: FastAPI):
    configure_logging()
    logger.info(f"[START] {settings.APP_NAME} v{settings.APP_VERSION}")
    try:
        await create_tables()
    except Exception as e:
        logger.error(f"[FAIL] DB setup failed: {e}")
    await ping_redis()

    # Start overstay detection — runs every 5 minutes
    from services.overstay_service import check_overstays
    scheduler.add_job(check_overstays, "interval", minutes=5, id="overstay_check")
    scheduler.start()
    logger.info("[OK] Overstay scheduler started (every 5 min)")
    logger.info("[OK] Ready")

    yield

    scheduler.shutdown(wait=False)
    await engine.dispose()
    logger.info("[STOP] Shutdown complete")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Smart Event Access & Guest Intelligence Platform",
    docs_url="/docs" if not settings.is_production else None,
    redoc_url="/redoc" if not settings.is_production else None,
    redirect_slashes=False,
    lifespan=lifespan,
)

# Middleware
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(CORSMiddleware, allow_origins=settings.allowed_origins_list,
                   allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

# ── REST Routes ────────────────────────────────────────────────────────────────
from routes.auth_routes         import router as auth_router
from routes.space_routes        import router as space_router
from routes.invite_routes       import router as invite_router
from routes.visitor_routes      import router as visitor_router
from routes.entry_routes        import router as entry_router
from routes.exit_routes         import router as exit_router
from routes.walkin_routes       import router as walkin_router
from routes.dashboard_routes    import router as dashboard_router
from routes.overstay_routes     import router as overstay_router
from routes.notification_routes import router as notification_router
from routes.document_routes     import router as document_router

app.include_router(auth_router,         prefix="/auth",          tags=["Auth"])
app.include_router(space_router,        prefix="/spaces",        tags=["Spaces"])
app.include_router(invite_router,       prefix="/invites",       tags=["Invites"])
app.include_router(visitor_router,      prefix="/visitor",       tags=["Visitor"])
app.include_router(entry_router,        prefix="/entry",         tags=["Entry"])
app.include_router(exit_router,         prefix="/exit",          tags=["Exit"])
app.include_router(walkin_router,       prefix="/walkins",       tags=["Walk-In"])
app.include_router(dashboard_router,    prefix="/dashboard",     tags=["Dashboard"])
app.include_router(overstay_router,     prefix="/overstay",      tags=["Overstay"])
app.include_router(notification_router, prefix="/notifications", tags=["Notifications"])
app.include_router(document_router,     prefix="/documents",     tags=["Documents"])


# ── WebSocket ──────────────────────────────────────────────────────────────────
from websocket.dashboard_ws import manager

@app.websocket("/ws/dashboard/{space_id}")
async def dashboard_ws(space_id: str, ws: WebSocket):
    """
    Live dashboard WebSocket.
    Connect with: ws://host/ws/dashboard/<space_id>
    Receives JSON events for ENTRY, EXIT, and WALKIN.
    No auth on WS for simplicity — add token query param in production.
    """
    await manager.connect(space_id, ws)
    try:
        while True:
            # Keep connection alive; we only send, never receive
            await ws.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(space_id, ws)


# ── Health ─────────────────────────────────────────────────────────────────────
@app.get("/", tags=["Health"])
async def root():
    return JSONResponse({"app": settings.APP_NAME, "version": settings.APP_VERSION, "docs": "/docs"})


@app.get("/health", tags=["Health"])
async def health():
    return JSONResponse({"status": "healthy"})
