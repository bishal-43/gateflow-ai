"""
config.py — Central configuration loader.
Reads all settings from .env so nothing is hardcoded anywhere else.
"""

import os
from dotenv import load_dotenv

# Load .env file into environment variables
load_dotenv()

# Google Gemini credentials
GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")

# ChromaDB — where vector data is persisted on disk
CHROMA_DB_PATH: str = os.getenv("CHROMA_DB_PATH", "./gateflow_db")

# Gemini embedding model — MUST be the same at ingest time and query time
EMBEDDING_MODEL: str = os.getenv("EMBEDDING_MODEL", "models/gemini-embedding-001")

# Gemini LLM model used to generate the final answer
LLM_MODEL: str = os.getenv("LLM_MODEL", "models/gemini-2.5-flash")

# How many sentences on each side of the matched sentence to include as context
WINDOW_SIZE: int = int(os.getenv("WINDOW_SIZE", "2"))

# FastAPI server
HOST: str = os.getenv("HOST", "0.0.0.0")
PORT: int = int(os.getenv("PORT", "8000"))

# ── Redis semantic cache ───────────────────────────────────────────────────────
REDIS_HOST: str  = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT: int  = int(os.getenv("REDIS_PORT", "6379"))
REDIS_DB:   int  = int(os.getenv("REDIS_DB",   "0"))

# How similar two questions must be to count as a cache hit
# 0.92 = strict (only near-identical questions hit) — good default
SIMILARITY_THRESHOLD: float = float(os.getenv("SIMILARITY_THRESHOLD", "0.92"))

# How long cached answers live in Redis (seconds) — 86400 = 24 hours
CACHE_TTL: int = int(os.getenv("CACHE_TTL", "86400"))

# Validate that the API key is present — fail early with a clear message
if not GEMINI_API_KEY:
    raise EnvironmentError(
        "GEMINI_API_KEY is not set. "
        "Copy .env.example to .env and add your Gemini API key."
    )
