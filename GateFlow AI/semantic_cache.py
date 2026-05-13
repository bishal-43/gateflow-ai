"""
semantic_cache.py — Redis-backed semantic cache for GateFlow AI.

Instead of checking if two questions are EXACTLY the same (string match),
we check if they MEAN the same thing (vector similarity via cosine similarity).

Flow:
  Incoming question
      ↓
  Embed question → vector
      ↓
  Compare against all cached vectors for this event (cosine similarity)
      ↓
  score >= threshold?  → return cached answer  (no LLM call)
  score <  threshold?  → return None           (caller runs full RAG)
"""

import redis
import json
import time
import numpy as np

from embeddings import get_query_embedding
from config import (
    REDIS_HOST,
    REDIS_PORT,
    REDIS_DB,
    CACHE_TTL,
    SIMILARITY_THRESHOLD,
)

# ── Redis connection ──────────────────────────────────────────────────────────
cache = redis.Redis(
    host=REDIS_HOST,
    port=REDIS_PORT,
    db=REDIS_DB,
    decode_responses=True
)


def _ping_redis() -> bool:
    """Check Redis is reachable. Fails gracefully if not."""
    try:
        return cache.ping()
    except Exception:
        return False


def cosine_similarity(vec_a: list[float], vec_b: list[float]) -> float:
    """
    Measure how similar two vectors are.
    Returns 1.0 = identical meaning, 0.0 = completely unrelated.
    """
    a = np.array(vec_a)
    b = np.array(vec_b)
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)

    if norm_a == 0 or norm_b == 0:
        return 0.0

    return float(np.dot(a, b) / (norm_a * norm_b))


def check_cache(question: str, event_id: str) -> dict | None:
    """
    Look for a semantically similar question in the cache.

    Args:
        question:  The guest's question
        event_id:  Which event to search cache for

    Returns:
        dict with answer + cache metadata, or None on miss
    """
    if not _ping_redis():
        print("[CACHE] Redis not reachable — skipping cache check")
        return None

    question_embedding = get_query_embedding(question)

    pattern = f"cache:{event_id}:*"
    keys = cache.keys(pattern)

    if not keys:
        print(f"[CACHE MISS] No cached entries for event '{event_id}'")
        return None

    best_score = 0.0
    best_match = None

    for key in keys:
        raw = cache.get(key)
        if not raw:
            continue

        try:
            entry = json.loads(raw)
        except json.JSONDecodeError:
            continue

        cached_embedding = entry.get("embedding")
        if not cached_embedding:
            continue

        score = cosine_similarity(question_embedding, cached_embedding)

        if score > best_score:
            best_score = score
            best_match = entry

    if best_score >= SIMILARITY_THRESHOLD and best_match:
        print(
            f"[CACHE HIT]  score={best_score:.3f} | "
            f"matched: '{best_match['original_question'][:60]}'"
        )
        return {
            "answer":           best_match["answer"],
            "cache_hit":        True,
            "similarity_score": round(best_score, 4),
            "matched_question": best_match["original_question"],
        }

    print(f"[CACHE MISS] best score={best_score:.3f} — running full RAG")
    return None


def store_in_cache(question: str, answer: str, event_id: str) -> None:
    """
    Save a question + answer pair in Redis so future similar questions hit cache.

    Args:
        question:  The original question that was answered
        answer:    The LLM-generated answer
        event_id:  Which event this belongs to
    """
    if not _ping_redis():
        print("[CACHE] Redis not reachable — skipping cache store")
        return

    embedding = get_query_embedding(question)
    key = f"cache:{event_id}:{int(time.time() * 1000)}"

    entry = {
        "original_question": question,
        "answer":            answer,
        "embedding":         embedding,
        "event_id":          event_id,
        "timestamp":         time.time(),
    }

    cache.setex(key, CACHE_TTL, json.dumps(entry))
    print(f"[CACHE STORE] '{question[:60]}' → {key} (TTL: {CACHE_TTL}s)")


def clear_event_cache(event_id: str) -> int:
    """
    Delete all cached answers for a specific event.

    Args:
        event_id:  The event whose cache to clear

    Returns:
        Number of keys deleted
    """
    if not _ping_redis():
        print("[CACHE] Redis not reachable — skipping cache clear")
        return 0

    pattern = f"cache:{event_id}:*"
    keys = cache.keys(pattern)

    if not keys:
        print(f"[CACHE CLEAR] No entries found for event '{event_id}'")
        return 0

    deleted = cache.delete(*keys)
    print(f"[CACHE CLEAR] Deleted {deleted} entries for event '{event_id}'")
    return deleted


def get_cache_stats(event_id: str) -> dict:
    """
    Return stats about the cache for a given event.

    Args:
        event_id:  The event to inspect

    Returns:
        dict with entry count and config
    """
    if not _ping_redis():
        return {"error": "Redis not reachable"}

    pattern = f"cache:{event_id}:*"
    keys = cache.keys(pattern)

    return {
        "event_id":       event_id,
        "cached_entries": len(keys),
        "ttl_seconds":    CACHE_TTL,
        "threshold":      SIMILARITY_THRESHOLD,
    }
