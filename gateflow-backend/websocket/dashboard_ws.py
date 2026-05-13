"""websocket/dashboard_ws.py — Live dashboard WebSocket

Clients connect to:  ws://host/ws/dashboard/{space_id}?token=<access_jwt>

After connection the server pushes JSON whenever:
  - A visitor enters    → { "event": "ENTRY", ... }
  - A visitor exits     → { "event": "EXIT",  ... }
  - A walk-in arrives   → { "event": "WALKIN", ... }

Design:
  - ConnectionManager is in-memory — works for a single-server deployment.
  - Broadcast is called AFTER db.commit() so DB state is guaranteed written.
  - Dead connections are cleaned up automatically on the next broadcast attempt.
"""
import json
from uuid import UUID

from fastapi import WebSocket, WebSocketDisconnect
from utils.logger import logger


class ConnectionManager:
    """Tracks active WebSocket connections grouped by space_id (as string)."""

    def __init__(self) -> None:
        # space_id_str → list of active WebSocket connections
        self._connections: dict[str, list[WebSocket]] = {}

    async def connect(self, space_id: str, ws: WebSocket) -> None:
        await ws.accept()
        self._connections.setdefault(space_id, []).append(ws)
        logger.info(f"[WS] Connected  space={space_id} total={len(self._connections[space_id])}")

    def disconnect(self, space_id: str, ws: WebSocket) -> None:
        pool = self._connections.get(space_id, [])
        if ws in pool:
            pool.remove(ws)
        logger.info(f"[WS] Disconnected space={space_id} remaining={len(pool)}")

    async def broadcast(self, space_id: str, message: dict) -> None:
        """
        Send a JSON message to every client connected to this space.
        Dead connections (closed without a clean handshake) are pruned silently.
        """
        pool = self._connections.get(space_id, [])
        if not pool:
            return  # no subscribers — skip serialisation

        payload = json.dumps(message, default=str)  # default=str handles UUID/datetime
        dead: list[WebSocket] = []

        for ws in list(pool):  # iterate a copy so we can mutate the original
            try:
                await ws.send_text(payload)
            except Exception:
                dead.append(ws)

        for ws in dead:
            self.disconnect(space_id, ws)


# Shared singleton — imported by services and main.py
manager = ConnectionManager()


# ── Typed broadcast helpers ───────────────────────────────────────────────────

async def broadcast_entry(space_id: UUID, visitor_name: str, session_id: UUID, gate_id: str | None) -> None:
    await manager.broadcast(str(space_id), {
        "event":        "ENTRY",
        "space_id":     str(space_id),
        "visitor_name": visitor_name,
        "session_id":   str(session_id),
        "gate_id":      gate_id,
    })


async def broadcast_exit(space_id: UUID, visitor_name: str, session_id: UUID) -> None:
    await manager.broadcast(str(space_id), {
        "event":        "EXIT",
        "space_id":     str(space_id),
        "visitor_name": visitor_name,
        "session_id":   str(session_id),
    })


async def broadcast_walkin(space_id: UUID, visitor_name: str, walkin_id: UUID) -> None:
    await manager.broadcast(str(space_id), {
        "event":        "WALKIN",
        "space_id":     str(space_id),
        "visitor_name": visitor_name,
        "walkin_id":    str(walkin_id),
    })
