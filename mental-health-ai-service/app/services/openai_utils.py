import json
from typing import Any, Dict, List, Optional

from openai import OpenAI


_client: Optional[OpenAI] = None


def get_openai_client(api_key: str) -> OpenAI:
    """Lazily initialize and reuse one OpenAI client instance."""
    global _client
    if _client is None:
        _client = OpenAI(api_key=api_key)
    return _client


def parse_openai_response(content: str) -> Dict[str, Any]:
    """Parse JSON from model output and keep a safe fallback shape."""
    try:
        return json.loads(content)
    except json.JSONDecodeError:
        return {"bot_reply": content, "recommendations": []}


def create_chat_completion(
    client: OpenAI,
    model: str,
    messages: List[Dict[str, str]],
    temperature: float,
    timeout: float,
) -> Dict[str, Any]:
    response = client.chat.completions.create(
        model=model,
        messages=messages,
        response_format={"type": "json_object"},
        temperature=temperature,
        timeout=timeout,
    )
    content = response.choices[0].message.content or "{}"
    return parse_openai_response(content)


def create_embedding(
    client: OpenAI,
    text: str,
    model: str = "text-embedding-3-small",
) -> Optional[List[float]]:
    """Return an embedding vector for a text. Fail-safe returns None."""
    try:
        resp = client.embeddings.create(model=model, input=text)
        return resp.data[0].embedding
    except Exception:
        return None
