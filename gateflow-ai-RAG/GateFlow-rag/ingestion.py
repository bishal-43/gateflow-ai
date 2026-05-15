"""
ingestion.py — PDF ingestion pipeline.
Run once per uploaded document. Extracts text, splits into sentences,
embeds each sentence, and stores everything in ChromaDB.

Handles two types of PDFs automatically:
  - Text-based PDFs : direct extraction via PyMuPDF (fast, no extra deps)
  - Image-based PDFs: OCR via EasyOCR (first run downloads ~100MB model, cached after)

Pipeline:
  PDF file → raw text (or OCR) → sentences → embeddings → ChromaDB
"""

import fitz          # PyMuPDF — text extraction and page rendering
import nltk          # sentence splitting
import json          # serialize sentence list into metadata
import io            # in-memory byte buffer for image conversion
from embeddings import get_embedding   # RETRIEVAL_DOCUMENT task type
from database import get_collection

# Download Punkt tokenizer if not already cached
nltk.download("punkt",     quiet=True)
nltk.download("punkt_tab", quiet=True)

# EasyOCR reader is expensive to initialise — create it once, reuse it
_ocr_reader = None


def _get_ocr_reader():
    """
    Lazy-load the EasyOCR reader with English + Hindi support.
    First call downloads models (~200 MB total), cached after that.
    """
    global _ocr_reader
    if _ocr_reader is None:
        import easyocr
        print("  [OCR] Loading EasyOCR model (first time may take a minute)...")
        # 'en' = English/Latin,  'hi' = Hindi/Devanagari/Marathi
        _ocr_reader = easyocr.Reader(["en", "hi"], verbose=False)
        print("  [OCR] Model ready.")
    return _ocr_reader


def _ocr_page(page) -> str:
    """
    Run EasyOCR on a single PDF page rendered as a high-res image.
    Called only when direct text extraction returns nothing.

    Args:
        page: A PyMuPDF page object

    Returns:
        OCR-extracted text string
    """
    # Render page at 2× zoom for better OCR accuracy
    mat = fitz.Matrix(2.0, 2.0)
    pix = page.get_pixmap(matrix=mat)
    img_bytes = pix.tobytes("png")   # raw PNG bytes — EasyOCR accepts these directly

    reader  = _get_ocr_reader()
    results = reader.readtext(img_bytes)

    # Each result is (bounding_box, text, confidence)
    # Filter out very low-confidence detections to reduce noise
    lines = [text for (_, text, conf) in results if conf > 0.1]
    return " ".join(lines)


def extract_text_from_pdf(pdf_path: str) -> str:
    """
    Extract all text from a PDF, page by page.

    Strategy per page:
      1. Try PyMuPDF direct extraction (instant, works on text PDFs)
      2. If empty → fall back to EasyOCR (handles scanned/screenshot PDFs)

    Args:
        pdf_path: Path to the PDF file

    Returns:
        Full document text as a single string
    """
    doc = fitz.open(pdf_path)
    full_text = ""
    ocr_pages = []

    for page_num, page in enumerate(doc):
        page_text = page.get_text("text").strip()

        if page_text:
            # Text PDF — fast path
            print(f"  Page {page_num + 1}: direct extraction — {len(page_text)} chars")
            full_text += page_text + "\n"
        else:
            # Image-only page — OCR path
            print(f"  Page {page_num + 1}: image-only, running OCR...")
            ocr_text = _ocr_page(page)
            print(f"  Page {page_num + 1}: OCR extracted {len(ocr_text)} chars")
            full_text += ocr_text + "\n"
            ocr_pages.append(page_num + 1)

    doc.close()

    if ocr_pages:
        print(f"  [INFO] OCR was used on pages: {ocr_pages}")

    return full_text


def split_into_sentences(text: str) -> list[str]:
    """
    Split document text into individual sentences using NLTK.

    Args:
        text: Full document text

    Returns:
        List of clean sentence strings (length > 10 chars)
    """
    sentences = nltk.sent_tokenize(text)
    # Min length of 10 chars — works for both English and Hindi/Marathi sentences
    sentences = [s.strip() for s in sentences if len(s.strip()) > 10]
    return sentences


def ingest_pdf(pdf_path: str, event_id: str) -> dict:
    """
    Full ingestion pipeline: PDF → ChromaDB.

    Steps:
      1. Extract text (with OCR fallback for image pages)
      2. Split into sentences
      3. Embed each sentence via Gemini
      4. Upsert into ChromaDB under this event_id

    Args:
        pdf_path:  Path to the PDF file
        event_id:  Unique event identifier (e.g. "event_001")

    Returns:
        dict with status, event_id, sentences count, characters count
    """
    print(f"\n[INGEST] Starting ingestion for event '{event_id}'")
    print(f"[INGEST] PDF: {pdf_path}")

    # ── Step 1: Extract text ──────────────────────────────────────────────────
    print("[INGEST] Extracting text from PDF...")
    full_text = extract_text_from_pdf(pdf_path)
    print(f"[INGEST] Total characters extracted: {len(full_text)}")

    # ── Step 2: Split into sentences ──────────────────────────────────────────
    print("[INGEST] Splitting into sentences...")
    sentences = split_into_sentences(full_text)
    print(f"[INGEST] Sentences found: {len(sentences)}")

    if not sentences:
        return {"status": "error", "message": "No sentences found in PDF"}

    # ── Step 3 & 4: Embed and store ───────────────────────────────────────────
    collection     = get_collection(event_id)
    sentences_json = json.dumps(sentences)   # stored in every row for window expansion

    print(f"[INGEST] Embedding and storing {len(sentences)} sentences...")

    ids        = []
    embeddings = []
    documents  = []
    metadatas  = []

    for i, sentence in enumerate(sentences):
        embedding = get_embedding(sentence)

        ids.append(f"{event_id}_s{i}")
        embeddings.append(embedding)
        documents.append(sentence)
        metadatas.append({
            "event_id":        event_id,
            "sentence_index":  i,
            "total_sentences": len(sentences),
            "all_sentences":   sentences_json   # full list for window expansion at query time
        })

        if (i + 1) % 20 == 0 or (i + 1) == len(sentences):
            print(f"  [{i + 1}/{len(sentences)}] embedded")

    # upsert = insert new, update existing — safe to re-run
    collection.upsert(
        ids=ids,
        embeddings=embeddings,
        documents=documents,
        metadatas=metadatas
    )

    print(f"[INGEST] ✓ Done — {len(sentences)} sentences stored for '{event_id}'")

    return {
        "status":     "success",
        "event_id":   event_id,
        "sentences":  len(sentences),
        "characters": len(full_text)
    }
