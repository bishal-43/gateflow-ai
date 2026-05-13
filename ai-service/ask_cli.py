"""
ask_cli.py — Command-line tool for asking questions without starting the server.

Usage:
  python ask_cli.py --event event_001 --question "What time does registration open?"
  python ask_cli.py --event event_001 --interactive
  python ask_cli.py --event event_001 --question "Where is the keynote?" --debug
"""

import argparse
from rag_pipeline import answer_guest_question


def ask_once(event_id: str, question: str, debug: bool = False):
    """Ask a single question and print the answer."""
    print(f"\nQuestion: {question}")
    print("-" * 50)

    result = answer_guest_question(
        question=question,
        event_id=event_id,
        include_debug=debug
    )

    print(f"Answer:    {result['answer']}")
    print(f"Cache hit: {result['cache_hit']}")

    if result['cache_hit']:
        print(f"Score:     {result.get('similarity_score')}")
        print(f"Matched:   {result.get('matched_question')}")

    if debug and "debug" in result:
        d = result["debug"]
        print(f"\n[DEBUG] Matches found: {d['matches_found']}")
        for i, match in enumerate(d["matches"]):
            print(f"  Match {i+1}: sentence #{match['sentence_index']} | distance={match['distance']}")


def interactive_mode(event_id: str, debug: bool = False):
    """Keep asking questions until the user types 'exit'."""
    print(f"\n{'='*50}")
    print(f"  GateFlow AI — Interactive Mode")
    print(f"  Event: {event_id}")
    print(f"  Type 'exit' to quit")
    print(f"{'='*50}\n")

    while True:
        try:
            question = input("Your question: ").strip()
        except (KeyboardInterrupt, EOFError):
            print("\nGoodbye!")
            break

        if question.lower() in ("exit", "quit", "q"):
            print("Goodbye!")
            break

        if not question:
            continue

        ask_once(event_id=event_id, question=question, debug=debug)
        print()


def main():
    parser = argparse.ArgumentParser(description="GateFlow AI — Ask questions about an event")
    parser.add_argument("--event",       required=True, help="Event ID to query")
    parser.add_argument("--question", "-q", help="Question to ask")
    parser.add_argument("--interactive", "-i", action="store_true", help="Interactive mode")
    parser.add_argument("--debug",       action="store_true", help="Show matched sentences")

    args = parser.parse_args()

    if args.interactive or not args.question:
        interactive_mode(event_id=args.event, debug=args.debug)
    else:
        ask_once(event_id=args.event, question=args.question, debug=args.debug)


if __name__ == "__main__":
    main()
