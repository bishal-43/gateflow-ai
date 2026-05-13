"""
retrieval.py — Query pipeline.
Takes a guest's question, finds the most relevant sentences in ChromaDB,
expands a context window around each match, and returns the combined context.

Pipeline:
  Question → embedding → ChromaDB search → window expansion → context string
"""

import json
from embeddings import get_query_embedding   # uses RETRIEVAL_QUERY task type
from database import get_collection
from config import WINDOW_SIZE


def expand_window(
    matched_index: int,
    all_sentences: list[str],
    window_size: int
) -> str:
    """
    Grab sentences surrounding the matched sentence.

    Example with window_size=2, matched_index=14, total=50 sentences:
      start = max(0, 14-2) = 12
      end   = min(50, 14+2+1) = 17
      window = sentences[12:17]  →  sentences 12, 13, 14, 15, 16

    Args:
        matched_index: Index of the sentence that matched the query
        all_sentences: Full list of sentences from the document
        window_size:   How many sentences to grab on each side

    Returns:
        The window sentences joined into a single string
    """
    start  = max(0, matched_index - window_size)
    end    = min(len(all_sentences), matched_index + window_size + 1)
    window = all_sentences[start:end]
    return " ".join(window)


def retrieve_context(
    question: str,
    event_id: str,
    top_k: int = 3,
    window_size: int = WINDOW_SIZE
) -> tuple[str, list[dict]]:
    """
    Find the most relevant context for a guest's question.

    Steps:
    1. Embed the question (RETRIEVAL_QUERY task type)
    2. Query ChromaDB for top_k most similar sentences
    3. Expand a window around each match
    4. Deduplicate overlapping windows
    5. Return combined context string

    Args:
        question:    The guest's question text
        event_id:    Which event's documents to search
        top_k:       How many candidate sentences to retrieve (default 3)
        window_size: Sentences on each side of each match (default from config)

    Returns:
        Tuple of (context_string, list of match metadata for debugging)
    """
    # ── Step 1: Embed the question ────────────────────────────────────────────
    question_embedding = get_query_embedding(question)

    # ── Step 2: Search ChromaDB ───────────────────────────────────────────────
    collection = get_collection(event_id)

    results = collection.query(
        query_embeddings=[question_embedding],
        n_results=top_k,
        where={"event_id": event_id}   # filter to THIS event only
    )

    # No results found
    if not results["documents"] or not results["documents"][0]:
        return "", []

    # ── Step 3 & 4: Window expansion + deduplication ──────────────────────────
    context_pieces = []
    match_metadata = []
    seen_indices   = set()

    for i in range(len(results["documents"][0])):
        matched_sentence = results["documents"][0][i]
        metadata         = results["metadatas"][0][i]
        distance         = results["distances"][0][i]

        matched_index = metadata["sentence_index"]
        all_sentences = json.loads(metadata["all_sentences"])

        start = max(0, matched_index - window_size)
        end   = min(len(all_sentences), matched_index + window_size + 1)

        # Skip if this window overlaps heavily with a previous one
        window_indices = set(range(start, end))
        if window_indices & seen_indices:
            overlap = len(window_indices & seen_indices)
            if overlap > window_size:
                continue

        seen_indices.update(window_indices)

        window_text = expand_window(matched_index, all_sentences, window_size)
        context_pieces.append(window_text)

        match_metadata.append({
            "matched_sentence": matched_sentence,
            "sentence_index":   matched_index,
            "distance":         round(distance, 4),
            "window_start":     start,
            "window_end":       end - 1
        })

    # ── Step 5: Combine all windows ───────────────────────────────────────────
    full_context = "\n\n---\n\n".join(context_pieces)

    return full_context, match_metadata
