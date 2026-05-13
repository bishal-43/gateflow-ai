"""
rag_pipeline.py — The complete RAG pipeline with semantic cache.

Full flow:
  Question + Event ID
      ↓
  check_cache()          ← Redis semantic cache (fast, no LLM call)
      ↓ cache hit?
      └─ YES → return cached answer immediately
      └─ NO  ↓
  retrieve_context()     ← embeddings.py + ChromaDB
      ↓
  generate_answer()      ← Gemini LLM
      ↓
  store_in_cache()       ← save to Redis for next time
      ↓
  return answer
"""

from retrieval import retrieve_context
from llm import generate_answer
from semantic_cache import check_cache, store_in_cache
from config import WINDOW_SIZE


def answer_guest_question(
    question: str,
    event_id: str,
    window_size: int = WINDOW_SIZE,
    top_k: int = 3,
    include_debug: bool = False
) -> dict:
    """
    End-to-end RAG with semantic cache.

    Args:
        question:      The guest's question
        event_id:      Which event's documents to search
        window_size:   Sentences on each side of each match
        top_k:         Number of candidate sentences to retrieve
        include_debug: If True, include match metadata in the response

    Returns:
        dict with question, answer, cache_hit, and optional debug info
    """

    # ── Step 1: Check semantic cache ──────────────────────────────────────────
    cached = check_cache(question=question, event_id=event_id)

    if cached:
        return {
            "question":         question,
            "answer":           cached["answer"],
            "cache_hit":        True,
            "similarity_score": cached["similarity_score"],
            "matched_question": cached["matched_question"],
        }

    # ── Step 2: Cache miss — run full RAG pipeline ────────────────────────────
    context, match_metadata = retrieve_context(
        question=question,
        event_id=event_id,
        top_k=top_k,
        window_size=window_size
    )

    answer = generate_answer(question=question, context=context)

    # ── Step 3: Store result in cache for future similar questions ────────────
    store_in_cache(question=question, answer=answer, event_id=event_id)

    # ── Step 4: Build response ────────────────────────────────────────────────
    response = {
        "question":  question,
        "answer":    answer,
        "cache_hit": False,
    }

    if include_debug:
        response["debug"] = {
            "event_id":      event_id,
            "window_size":   window_size,
            "top_k":         top_k,
            "matches_found": len(match_metadata),
            "matches":       match_metadata,
            "context_used":  context,
        }

    return response
