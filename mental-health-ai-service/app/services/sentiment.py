from typing import Dict

from textblob import TextBlob

from ..core.config import MODEL, OPENAI_API_KEY
from .openai_utils import create_chat_completion, get_openai_client


def _mood_from_score(score: float) -> str:
    if score > 0.2:
        return "POSITIVE"
    if score < -0.2:
        return "NEGATIVE"
    return "NEUTRAL"


def _analyze_with_textblob(text: str) -> Dict[str, float | str]:
    blob = TextBlob(text or "")
    polarity = float(blob.sentiment.polarity or 0.0)
    return {"score": polarity, "mood": _mood_from_score(polarity)}


def _refine_with_openai(text: str, quick_score: float) -> Dict[str, float | str]:
    client = get_openai_client(OPENAI_API_KEY)
    prompt = (
        "Bạn là mô-đun phân tích cảm xúc cho tiếng Việt. "
        "Dựa trên đoạn văn bản của người dùng, hãy trả về đúng JSON với 2 trường: "
        "score (số thực từ -1 đến 1) và mood (NEGATIVE, NEUTRAL, POSITIVE). "
        "Chỉ trả về JSON hợp lệ, không giải thích thêm."
    )

    result = create_chat_completion(
        client=client,
        model=MODEL,
        messages=[
            {"role": "system", "content": prompt},
            {
                "role": "user",
                "content": (
                    f"Văn bản: {text}\n"
                    f"Kết quả sơ bộ từ TextBlob: score={quick_score:.3f}. "
                    "Hãy tinh chỉnh lại nếu thấy chưa chắc chắn."
                ),
            },
        ],
        temperature=0.0,
        timeout=15.0,
    )

    refined_score = result.get("score", quick_score)
    refined_mood = str(result.get("mood", "")).upper().strip()

    try:
        refined_score = float(refined_score)
    except (TypeError, ValueError):
        refined_score = quick_score

    if refined_mood not in {"NEGATIVE", "NEUTRAL", "POSITIVE"}:
        refined_mood = _mood_from_score(refined_score)

    # Blend the fast score with the refined score for a more stable result.
    blended_score = round((quick_score * 0.35) + (refined_score * 0.65), 4)
    return {"score": blended_score, "mood": refined_mood}


def analyze_sentiment(text: str) -> dict:
    """Hybrid sentiment analysis: TextBlob for quick screening, OpenAI for refinement."""
    cleaned = (text or "").strip()
    if not cleaned:
        return {"score": 0.0, "mood": "NEUTRAL"}

    quick_result = _analyze_with_textblob(cleaned)
    quick_score = float(quick_result["score"])

    # Step 1: fast screening with TextBlob.
    if abs(quick_score) >= 0.3:
        return quick_result

    # Step 2: if uncertain, refine using OpenAI.
    if not OPENAI_API_KEY:
        return quick_result

    try:
        return _refine_with_openai(cleaned, quick_score)
    except Exception:
        # Keep the system responsive even if the OpenAI call fails.
        return quick_result
