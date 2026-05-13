"""
ingest_png.py — Ingest a PNG image into the RAG system using OCR.
"""

import argparse
import json
import nltk

from embeddings import get_embedding
from database import get_collection
from ingestion import _get_ocr_reader, split_into_sentences


def extract_text_from_png(png_path: str) -> str:
    """
    Extract text from a PNG image using EasyOCR.

    Args:
        png_path: Path to the PNG file

    Returns:
        Extracted text as a string
    """
    print(f"[INGEST] Extracting text from PNG: {png_path}")

    reader = _get_ocr_reader()
    results = reader.readtext(png_path)

    # Filter low confidence
    lines = [text for (_, text, conf) in results if conf > 0.1]
    full_text = " ".join(lines)
    print(f"[INGEST] Total characters extracted: {len(full_text)}")
    return full_text


def ingest_png(png_path: str, event_id: str) -> dict:
    """
    Full ingestion pipeline: PNG → ChromaDB.

    Steps:
      1. OCR text from PNG
      2. Split into sentences
      3. Embed each sentence
      4. Upsert into ChromaDB

    Args:
        png_path: Path to the PNG file
        event_id: Unique event identifier

    Returns:
        dict with status, etc.
    """
    print(f"\n[INGEST] Starting ingestion for event '{event_id}'")

    # Step 1: Extract text
    full_text = extract_text_from_png(png_path)

    # Step 2: Split into sentences
    print("[INGEST] Splitting into sentences...")
    sentences = split_into_sentences(full_text)
    print(f"[INGEST] Sentences found: {len(sentences)}")

    if not sentences:
        return {"status": "error", "message": "No sentences found in PNG"}

    # Step 3 & 4: Embed and store
    collection = get_collection(event_id)
    sentences_json = json.dumps(sentences)

    print(f"[INGEST] Embedding and storing {len(sentences)} sentences...")

    ids = []
    embeddings = []
    documents = []
    metadatas = []

    for i, sentence in enumerate(sentences):
        embedding = get_embedding(sentence)

        ids.append(f"{event_id}_s{i}")
        embeddings.append(embedding)
        documents.append(sentence)
        metadatas.append({
            "event_id": event_id,
            "sentence_index": i,
            "total_sentences": len(sentences),
            "all_sentences": sentences_json
        })

        if (i + 1) % 20 == 0 or (i + 1) == len(sentences):
            print(f"  [{i + 1}/{len(sentences)}] embedded")

    collection.upsert(
        ids=ids,
        embeddings=embeddings,
        documents=documents,
        metadatas=metadatas
    )

    print(f"[INGEST] ✓ Done — {len(sentences)} sentences stored for '{event_id}'")

    return {
        "status": "success",
        "event_id": event_id,
        "sentences": len(sentences),
        "characters": len(full_text)
    }


def main():
    parser = argparse.ArgumentParser(
        description="GateFlow AI — Ingest a PNG into the vector database"
    )
    parser.add_argument("--png", required=True, help="Path to the PNG file to ingest")
    parser.add_argument("--event", required=True, help="Unique event ID (e.g., event_001)")

    args = parser.parse_args()

    print(f"\n{'='*50}")
    print("  GateFlow AI — PNG Ingestion")
    print(f"{'='*50}")
    print(f"  PNG:      {args.png}")
    print(f"  Event ID: {args.event}")
    print(f"{'='*50}\n")

    result = ingest_png(png_path=args.png, event_id=args.event)

    if result["status"] == "success":
        print(f"\n{'='*50}")
        print("  ✓ Ingestion complete!")
        print(f"  Sentences stored: {result['sentences']}")
        print(f"  Characters read:  {result['characters']}")
        print(f"{'='*50}\n")
    else:
        print(f"\n✗ Ingestion failed: {result.get('message', 'Unknown error')}\n")


if __name__ == "__main__":
    main()