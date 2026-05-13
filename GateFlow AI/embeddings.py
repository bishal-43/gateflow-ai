"""
embeddings.py — Handles all Gemini embedding operations.
Converts text into vectors (lists of numbers) that represent semantic meaning.
"""

import google.generativeai as genai
from config import GEMINI_API_KEY, EMBEDDING_MODEL

# Configure the Gemini client with the API key
genai.configure(api_key=GEMINI_API_KEY)


def get_embedding(text: str) -> list[float]:
    """
    Turn any text into a vector (embedding) using Google Gemini.

    Why embeddings?
    - Similar sentences get similar vectors
    - We can search by meaning, not just keywords
    - "What time does registration start?" matches "Registration opens at 9 AM"
      even though they share no exact words

    Args:
        text: The sentence or question to embed

    Returns:
        A list of 768 floats (the vector representation)
    """
    result = genai.embed_content(
        model=EMBEDDING_MODEL,
        content=text,
        task_type="RETRIEVAL_DOCUMENT"   # optimised for document storage
    )
    return result["embedding"]


def get_query_embedding(text: str) -> list[float]:
    """
    Embed a guest's question using the RETRIEVAL_QUERY task type.

    Using the correct task type matters:
    - RETRIEVAL_DOCUMENT → used when storing sentences (ingestion)
    - RETRIEVAL_QUERY    → used when searching (query time)

    Args:
        text: The guest's question

    Returns:
        A list of 768 floats
    """
    result = genai.embed_content(
        model=EMBEDDING_MODEL,
        content=text,
        task_type="RETRIEVAL_QUERY"      # optimised for searching documents
    )
    return result["embedding"]
