"""
main.py — FastAPI application.

Endpoints:
  POST   /ingest/{event_id}        — Organizer uploads a PDF (auto-clears cache)
  GET    /ask/{event_id}           — Guest asks a question (cache-aware)
  GET    /events                   — List all ingested events
  DELETE /events/{event_id}        — Remove an event's data
  GET    /cache/{event_id}/stats   — Cache stats for an event
  DELETE /cache/{event_id}         — Manually clear cache for an event

Run with:
  uvicorn main:app --reload --host 0.0.0.0 --port 8000
"""

import os
import shutil
import tempfile

from fastapi import FastAPI, UploadFile, File, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

from ingestion import ingest_pdf
from rag_pipeline import answer_guest_question
from database import delete_collection, list_collections
from semantic_cache import clear_event_cache, get_cache_stats
from config import HOST, PORT

# ── App setup ─────────────────────────────────────────────────────────────────
app = FastAPI(
    title="GateFlow AI",
    description="RAG-powered event assistant with semantic cache",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)


# ── Response models ───────────────────────────────────────────────────────────

class IngestResponse(BaseModel):
    status:     str
    event_id:   str
    sentences:  int
    characters: int
    message:    str

class AskResponse(BaseModel):
    question:         str
    answer:           str
    event_id:         str
    cache_hit:        bool
    similarity_score: Optional[float] = None
    matched_question: Optional[str]   = None

class AskDebugResponse(AskResponse):
    debug: dict


# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/", tags=["Health"])
def root():
    """Health check."""
    return {"status": "ok", "service": "GateFlow AI", "version": "2.0.0"}


@app.post("/ingest/{event_id}", response_model=IngestResponse, tags=["Organizer"])
async def ingest_event_doc(
    event_id: str,
    file: UploadFile = File(..., description="PDF document for this event")
):
    """
    Organizer uploads a PDF for an event.
    Automatically clears the semantic cache so guests get fresh answers.
    """
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        shutil.copyfileobj(file.file, tmp)
        tmp_path = tmp.name

    try:
        result = ingest_pdf(pdf_path=tmp_path, event_id=event_id)
    finally:
        os.remove(tmp_path)

    if result["status"] == "error":
        raise HTTPException(status_code=422, detail=result["message"])

    # Auto-clear stale cache whenever docs are updated
    cleared = clear_event_cache(event_id)

    return IngestResponse(
        status=result["status"],
        event_id=result["event_id"],
        sentences=result["sentences"],
        characters=result["characters"],
        message=(
            f"Ingested {result['sentences']} sentences for '{event_id}'. "
            f"Cleared {cleared} stale cache entries."
        )
    )


@app.get("/ask/{event_id}", tags=["Guest"])
async def ask_question(
    event_id: str,
    q: str = Query(..., description="The guest's question", min_length=3),
    debug: bool = Query(False, description="Include RAG match metadata in response")
):
    """
    Guest asks a question about an event.
    Returns the answer plus cache_hit flag.
    """
    existing_events = list_collections()
    if event_id not in existing_events:
        raise HTTPException(
            status_code=404,
            detail=f"Event '{event_id}' not found. Please ingest a document first."
        )

    result = answer_guest_question(
        question=q,
        event_id=event_id,
        include_debug=debug
    )

    if debug and "debug" in result:
        return AskDebugResponse(
            question=result["question"],
            answer=result["answer"],
            event_id=event_id,
            cache_hit=result["cache_hit"],
            similarity_score=result.get("similarity_score"),
            matched_question=result.get("matched_question"),
            debug=result.get("debug", {})
        )

    return AskResponse(
        question=result["question"],
        answer=result["answer"],
        event_id=event_id,
        cache_hit=result["cache_hit"],
        similarity_score=result.get("similarity_score"),
        matched_question=result.get("matched_question"),
    )


@app.get("/events", tags=["Admin"])
def list_events():
    """List all ingested events."""
    events = list_collections()
    return {"events": events, "count": len(events)}


@app.delete("/events/{event_id}", tags=["Admin"])
def delete_event(event_id: str):
    """Delete all ChromaDB data and cache for an event."""
    success = delete_collection(event_id)
    if not success:
        raise HTTPException(
            status_code=404,
            detail=f"Event '{event_id}' not found or could not be deleted."
        )
    clear_event_cache(event_id)
    return {"status": "deleted", "event_id": event_id}


@app.get("/cache/{event_id}/stats", tags=["Admin"])
def cache_stats(event_id: str):
    """Show how many questions are cached for an event."""
    return get_cache_stats(event_id)


@app.delete("/cache/{event_id}", tags=["Admin"])
def invalidate_cache(event_id: str):
    """Manually clear all cached answers for an event."""
    deleted = clear_event_cache(event_id)
    return {
        "status":   "cache cleared",
        "event_id": event_id,
        "deleted":  deleted
    }


# ── Entry point ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=HOST, port=PORT, reload=True)
