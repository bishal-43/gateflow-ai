"""
llm.py — LLM answer generation using Google Gemini.
Takes the retrieved context and the guest's question,
sends them to Gemini, and returns a grounded answer.

This is the final step in the RAG pipeline:
  Context + Question → Gemini → Answer
"""

import google.generativeai as genai
from config import GEMINI_API_KEY, LLM_MODEL

# Configure Gemini with the API key
genai.configure(api_key=GEMINI_API_KEY)

# Initialise the generative model once (reused across all requests)
model = genai.GenerativeModel(
    model_name=LLM_MODEL,
    system_instruction="""You are GateFlow AI, a helpful and friendly assistant for event guests.

Your job is to answer questions about the event using ONLY the provided context.

Rules you must follow:
1. Answer ONLY from the context provided. Do not use outside knowledge.
2. If the answer is not in the context, say: "I don't have that information in the event documents. Please check with the event organizer."
3. Be concise and direct. Guests are at an event and need quick answers.
4. If the context contains partial information, share what you know and flag what's missing.
5. Never make up times, locations, names, or any other facts."""
)


def generate_answer(question: str, context: str) -> str:
    """
    Send the question + context to Gemini and get a grounded answer.

    Args:
        question: The guest's original question
        context:  The retrieved context from ChromaDB (window-expanded sentences)

    Returns:
        The Gemini-generated answer as a string
    """
    # If no context was retrieved, return a safe fallback immediately
    if not context.strip():
        return (
            "I couldn't find relevant information in the event documents. "
            "Please check with the event organizer or help desk."
        )

    user_message = f"""CONTEXT FROM EVENT DOCUMENTS:
{context}

GUEST QUESTION: {question}

ANSWER:"""

    response = model.generate_content(
        user_message,
        generation_config=genai.GenerationConfig(
            temperature=0.0,       # deterministic, factual
            max_output_tokens=512
        )
    )

    return response.text.strip()
