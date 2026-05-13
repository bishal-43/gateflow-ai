"""
ingest_cli.py — Command-line tool for ingesting PDFs without starting the server.

Usage:
  python ingest_cli.py --pdf path/to/document.pdf --event event_001
"""

import argparse
from ingestion import ingest_pdf


def main():
    parser = argparse.ArgumentParser(
        description="GateFlow AI — Ingest a PDF into the vector database"
    )
    parser.add_argument("--pdf",   required=True, help="Path to the PDF file to ingest")
    parser.add_argument("--event", required=True, help="Unique event ID (e.g., event_001)")

    args = parser.parse_args()

    print(f"\n{'='*50}")
    print(f"  GateFlow AI — PDF Ingestion")
    print(f"{'='*50}")
    print(f"  PDF:      {args.pdf}")
    print(f"  Event ID: {args.event}")
    print(f"{'='*50}\n")

    result = ingest_pdf(pdf_path=args.pdf, event_id=args.event)

    if result["status"] == "success":
        print(f"\n{'='*50}")
        print(f"  ✓ Ingestion complete!")
        print(f"  Sentences stored: {result['sentences']}")
        print(f"  Characters read:  {result['characters']}")
        print(f"{'='*50}\n")
    else:
        print(f"\n✗ Ingestion failed: {result.get('message', 'Unknown error')}\n")


if __name__ == "__main__":
    main()
