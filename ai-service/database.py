"""
database.py — ChromaDB connection and operations.
ChromaDB is a vector database — it stores embeddings and lets us search by similarity.
Uses chromadb >= 1.0 API.
"""

import chromadb
from config import CHROMA_DB_PATH

# PersistentClient saves data to disk automatically
# Every time you restart the server, your data is still there
chroma_client = chromadb.PersistentClient(path=CHROMA_DB_PATH)


def get_collection(collection_name: str):
    """
    Get or create a ChromaDB collection.
    A collection is like a table — one per event keeps data isolated.

    Args:
        collection_name: Unique name for this event (e.g., "event_001")

    Returns:
        A ChromaDB collection object
    """
    return chroma_client.get_or_create_collection(name=collection_name)


def delete_collection(collection_name: str) -> bool:
    """
    Delete an entire event's data.

    Args:
        collection_name: The event collection to delete
    """
    try:
        chroma_client.delete_collection(name=collection_name)
        return True
    except Exception:
        return False


def list_collections() -> list[str]:
    """
    List all event collections in the database.
    chromadb >= 1.0: list_collections() returns Collection objects.

    Returns:
        List of collection name strings
    """
    collections = chroma_client.list_collections()
    return [col.name for col in collections]
