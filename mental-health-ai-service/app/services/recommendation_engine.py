from typing import Any, Dict, List


HYBRID_WEIGHTS = {
    "llm": 0.5,
    "rule": 0.35,
    "history": 0.15,
}


def _tokenize(text: str) -> List[str]:
    return [token for token in (text or "").lower().split() if len(token) > 2]


def _normalize(values: List[float]) -> List[float]:
    if not values:
        return []
    v_min = min(values)
    v_max = max(values)
    if v_min == v_max:
        return [1.0 for _ in values]
    return [(v - v_min) / (v_max - v_min) for v in values]


def _extract_recent_categories(context: Dict[str, Any], history: List[Dict[str, Any]]) -> List[str]:
    result: List[str] = []

    direct = context.get("recentRecommendationCategories", [])
    if isinstance(direct, list):
        result.extend(str(x).upper() for x in direct if x)

    rec_history = context.get("recommendationHistory", [])
    if isinstance(rec_history, list):
        for item in rec_history:
            if isinstance(item, dict) and item.get("category"):
                result.append(str(item.get("category", "")).upper())

    for item in history[-6:]:
        if not isinstance(item, dict):
            continue
        content = str(item.get("content", ""))
        for category in [
            "PROFESSIONAL",
            "SLEEP",
            "MEDITATION",
            "BREATHING",
            "EXERCISE",
            "SOCIAL",
            "JOURNALING",
            "RELAXATION",
            "NUTRITION",
        ]:
            if category in content.upper():
                result.append(category)

    return result


def _llm_relevance_score(message: str, recommendation: Dict[str, Any]) -> float:
    text = f"{recommendation.get('title', '')} {recommendation.get('content', '')}".lower()
    tokens = _tokenize(message)
    if not tokens:
        return 0.0
    overlap = sum(1 for token in tokens if token in text)
    return overlap / max(1, len(tokens))


def _rule_score(message: str, recommendation: Dict[str, Any]) -> float:
    msg = (message or "").lower()
    category = str(recommendation.get("category", "")).upper()
    content = str(recommendation.get("content", "")).lower()

    category_keywords = {
        "SLEEP": ["ngủ", "mất ngủ", "thức khuya"],
        "BREATHING": ["thở", "hít", "căng thẳng", "stress"],
        "EXERCISE": ["vận động", "thể dục", "đi bộ"],
        "JOURNALING": ["viết", "nhật ký", "suy nghĩ"],
        "SOCIAL": ["bạn bè", "gia đình", "chia sẻ"],
        "RELAXATION": ["thư giãn", "nghỉ ngơi"],
        "MEDITATION": ["thiền", "chánh niệm"],
        "NUTRITION": ["ăn", "dinh dưỡng"],
        "PROFESSIONAL": ["chuyên gia", "bác sĩ", "tư vấn"],
    }

    keywords = category_keywords.get(category, [])
    score = 0.0
    for keyword in keywords:
        if keyword in msg:
            score += 1.0
        if keyword in content:
            score += 0.5
    return score


def _history_diversity_score(recommendation: Dict[str, Any], recent_categories: List[str]) -> float:
    category = str(recommendation.get("category", "")).upper()
    if not category:
        return 0.5
    recent_count = sum(1 for c in recent_categories if c == category)
    if recent_count == 0:
        return 1.0
    if recent_count == 1:
        return 0.6
    return 0.2


def rerank_recommendations_hybrid(
    recommendations: List[Dict[str, Any]],
    message: str,
    context: Dict[str, Any],
    history: List[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    """Hybrid scoring = weighted(llm, rule, history) with min-max normalization."""
    if not isinstance(recommendations, list) or len(recommendations) <= 1:
        return recommendations if isinstance(recommendations, list) else []

    valid: List[Dict[str, Any]] = []
    for item in recommendations:
        if isinstance(item, dict) and item.get("content"):
            valid.append(item)

    if len(valid) <= 1:
        return valid

    recent_categories = _extract_recent_categories(context or {}, history or [])

    llm_scores = [_llm_relevance_score(message, item) for item in valid]
    rule_scores = [_rule_score(message, item) for item in valid]
    history_scores = [_history_diversity_score(item, recent_categories) for item in valid]

    llm_norm = _normalize(llm_scores)
    rule_norm = _normalize(rule_scores)
    history_norm = _normalize(history_scores)

    scored: List[Dict[str, Any]] = []
    for idx, item in enumerate(valid):
        total = (
            HYBRID_WEIGHTS["llm"] * llm_norm[idx]
            + HYBRID_WEIGHTS["rule"] * rule_norm[idx]
            + HYBRID_WEIGHTS["history"] * history_norm[idx]
        )
        candidate = dict(item)
        candidate["_hybrid_score"] = round(total, 6)
        scored.append(candidate)

    scored.sort(key=lambda x: x.get("_hybrid_score", 0.0), reverse=True)

    # Remove internal debug score before returning payload.
    result: List[Dict[str, Any]] = []
    for item in scored:
        clean = dict(item)
        clean.pop("_hybrid_score", None)
        result.append(clean)
    return result


def needs_actionable_recommendations(message: str, bot_reply: str = "") -> bool:
    msg = (message or "").lower()
    reply = (bot_reply or "").lower()
    intent_keywords = [
        "phương pháp",
        "gợi ý",
        "làm gì",
        "cách",
        "hướng dẫn",
        "mẹo",
        "giúp tôi",
        "hỗ trợ",
        "stress",
        "căng thẳng",
        "mất ngủ",
    ]

    asks_for_methods = any(k in msg for k in intent_keywords)
    dangling_intro = (
        "dưới đây" in reply
        and ("gợi ý" in reply or "phương pháp" in reply)
        and (reply.rstrip().endswith(":") or reply.rstrip().endswith("."))
    )
    return asks_for_methods or dangling_intro


def build_default_recommendations(message: str) -> List[Dict[str, str]]:
    msg = (message or "").lower()

    if "mất ngủ" in msg or "ngủ" in msg:
        return [
            {
                "category": "SLEEP",
                "content": "Mỗi tối cố định một giờ đi ngủ, kể cả cuối tuần. Điều này giúp đồng hồ sinh học ổn định dần.",
            },
            {
                "category": "RELAXATION",
                "content": "Trước khi lên giường 20 phút, tắt hết màn hình, bật nhạc không lời nhẹ nhàng, rồi ngồi thở thôi.",
            },
            {
                "category": "RELAXATION",
                "content": "Tối nay thử uống một ly sữa ấm hoặc trà hoa lài, ngồi nghỉ chill rồi đi ngủ nhé.",
            },
        ]

    if "stress" in msg or "căng thẳng" in msg or "áp lực" in msg:
        return [
            {
                "category": "BREATHING",
                "content": "Dừng lại ngay! Hít vào 4 giây, giữ 4 giây, thở ra 6 giây. Lặp 6 vòng, bạn sẽ thấy nhẹ hơn nhiều.",
            },
            {
                "category": "EXERCISE",
                "content": "Ra ngoài đi bộ 10-15 phút thôi, vừa thay đổi không khí vừa giúp đầu óc tỉnh táo lại.",
            },
            {
                "category": "JOURNALING",
                "content": "Lấy giấy viết ra 3 điều đang làm bạn lo, rồi khoanh tròn 1 cái có thể xử lý luôn hôm nay nhé.",
            },
        ]

    return [
        {
            "category": "JOURNALING",
            "content": "Tối nay trước khi ngủ, viết nhanh 3 dòng: hôm nay vui vì gì, mệt vì gì, và biết ơn điều gì. Thử xem!",
        },
        {
            "category": "EXERCISE",
            "content": "Sáng mai dậy sớm 10 phút, ra ban công hoặc cửa sổ hít thở sâu 5 lần, cả ngày sẽ nhẹ nhàng hơn đó.",
        },
        {
            "category": "SOCIAL",
            "content": "Nhắn tin hoặc gọi điện cho một người bạn cũ lâu rồi chưa liên lạc, hỏi thăm và trò chuyện chút thôi.",
        },
    ]
