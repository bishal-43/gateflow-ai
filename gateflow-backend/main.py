"""
main.py — GateFlow AI entry point

Start: uvicorn main:app --reload
Docs:  http://localhost:8000/docs
"""
import os
from contextlib import asynccontextmanager
from urllib.parse import unquote
from uuid import UUID

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
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

# ── Static uploads (documents, walk-in proofs) ─────────────────────────────────
os.makedirs("uploads", exist_ok=True)
os.makedirs("uploads/documents", exist_ok=True)
os.makedirs("uploads/walkin", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


# ── WebSocket ──────────────────────────────────────────────────────────────────
from websocket.dashboard_ws import manager

@app.websocket("/ws/dashboard/{space_id}")
async def dashboard_ws(websocket: WebSocket, space_id: str):
    """
    Live dashboard WebSocket (authenticated).

    Connect with:
      ws://host/ws/dashboard/<space_id>?token=<access_jwt>

    ORGANIZER / RESIDENT: only spaces they own. ADMIN: any space.
    """
    raw = websocket.query_params.get("token") or websocket.query_params.get("access_token")
    if not raw:
        await websocket.close(code=1008)
        return
    token = unquote(raw).strip()
    if not token:
        await websocket.close(code=1008)
        return

    try:
        sid = UUID(space_id)
    except ValueError:
        await websocket.close(code=1008)
        return

    from database import AsyncSessionLocal
    from dependencies import user_from_access_token
    from services.space_service import ensure_space_access

    async with AsyncSessionLocal() as db:
        try:
            user = await user_from_access_token(db, token)
            await ensure_space_access(db, sid, user)
        except HTTPException:
            await websocket.close(code=1008)
            return

    sid_str = str(sid)
    await manager.connect(sid_str, websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(sid_str, websocket)


# ── Health ─────────────────────────────────────────────────────────────────────
@app.get("/", tags=["Health"])
async def root():
    return JSONResponse({"app": settings.APP_NAME, "version": settings.APP_VERSION, "docs": "/docs"})


@app.get("/health", tags=["Health"])
async def health():
    return JSONResponse({"status": "healthy"})
