import math
from typing import Any, Callable, Dict, List, Optional


EmbeddingProvider = Callable[[str], Optional[List[float]]]


def is_healing_library_feature_question(message: str) -> bool:
    msg = (message or "").lower()
    library_keywords = [
        "thư viện chữa lành",
        "thu vien chua lanh",
        "thư viện",
        "thu vien",
    ]
    feature_intents = [
        "là gì",
        "o dau",
        "ở đâu",
        "truy cập",
        "cách dùng",
        "dùng sao",
        "xài sao",
        "chức năng",
        "làm được gì",
        "mục nào",
        "tìm ở đâu",
        "có",
        "co",
        "không",
        "khong",
    ]

    material_terms = ["bài tập", "bai tap", "tài liệu", "tai lieu", "video", "thiền", "hít thở"]

    has_library_keyword = any(keyword in msg for keyword in library_keywords)
    asks_feature = any(intent in msg for intent in feature_intents) or "?" in msg
    mentions_material = any(term in msg for term in material_terms)

    # Catch common forms like "có thư viện các bài tập không?"
    return has_library_keyword and (asks_feature or mentions_material)


def is_healing_library_material_request(message: str) -> bool:
    msg = (message or "").lower()
    scope_keywords = [
        "thư viện chữa lành",
        "thu vien chua lanh",
        "thư viện",
        "thu vien",
        "tài liệu",
        "tai lieu",
        "bài viết",
        "video",
        "audio",
        "resource",
        "bài tập",
        "bai tap",
        "bài thực hành",
        "thuc hanh",
        "hướng dẫn",
        "huong dan",
    ]
    intent_keywords = [
        "tìm",
        "tim",
        "tìm kiếm",
        "tim kiem",
        "kiếm",
        "kiem",
        "gợi ý",
        "goi y",
        "đề xuất",
        "de xuat",
        "thiền",
        "thien",
        "hít thở",
        "hit tho",
        "thư giãn",
        "thu gian",
        "giảm lo âu",
        "giam lo au",
        "giảm stress",
        "gửi mình",
        "cho mình",
        "đưa mình",
        "tham khảo",
        "trích xuất",
        "đề xuất tài liệu",
        "xem tài liệu",
    ]

    has_scope = any(scope in msg for scope in scope_keywords)
    has_intent = any(intent in msg for intent in intent_keywords)

    # Handle short practical requests like "cho mình bài tập giảm lo âu".
    direct_material_patterns = [
        "bài tập",
        "bai tap",
        "tài liệu",
        "tai lieu",
        "video",
        "audio",
        "hướng dẫn",
        "huong dan",
    ]
    has_direct_material = any(pattern in msg for pattern in direct_material_patterns)

    yes_no_question_markers = ["có", "co", "không", "khong", "?"]
    has_yes_no_question = any(marker in msg for marker in yes_no_question_markers)

    return (
        (has_scope and has_intent)
        or (has_direct_material and has_intent)
        or (has_scope and has_direct_material and has_yes_no_question)
    )


def is_routine_2week_request(message: str) -> bool:
    """Detect if user is asking for a 2-week routine/plan/roadmap based on assessment result."""
    msg = (message or "").lower()
    
    routine_keywords = [
        "lộ trình",
        "lo trinh",
        "plan",
        "kế hoạch",
        "ke hoach",
        "chương trình",
        "chuong trinh",
        "quy trình",
        "quy trinh",
        "bước tiếp theo",
        "buoc tiep theo",
        "từng bước",
        "tung buoc",
        "phía trước",
        "phia truoc",
    ]
    
    time_indicators = [
        "2 tuần",
        "hai tuần",
        "2 tuan",
        "hai tuan",
        "tuần tới",
        "tuan toi",
        "tuần sau",
        "buoc tiep theo",
        "tiếp theo",
        "tiep theo",
        "cải thiện",
        "cai thien",
        "tăng cường",
        "tang cuong",
        "giải pháp",
        "giai phap",
    ]
    
    analysis_keywords = [
        "phân tích",
        "phan tich",
        "sâu hơn",
        "sau hon",
        "chi tiết",
        "chi tiet",
        "cụ thể",
        "cu the",
        "cách làm",
        "cach lam",
        "nên làm",
        "nen lam",
        "nên làm gì",
        "bước nào",
        "buoc nao",
    ]
    
    has_routine = any(keyword in msg for keyword in routine_keywords)
    has_time_indicator = any(indicator in msg for indicator in time_indicators)
    has_analysis = any(keyword in msg for keyword in analysis_keywords)
    
    # Request for routine if mentions routine + time/analysis
    # Or specific forms like "phân tích sâu hơn và đưa ra lộ trình"
    return (has_routine and (has_time_indicator or has_analysis)) or (has_analysis and has_time_indicator and "lộ trình" in msg)


def build_healing_library_feature_reply(feature_info: Dict[str, Any], resources: List[Dict[str, Any]]) -> Dict[str, Any]:
    feature_name = feature_info.get("name", "Thư viện chữa lành")
    availability = feature_info.get("availability", "Trong dashboard người dùng")
    summary = feature_info.get(
        "summary",
        "Nơi tập hợp các tài nguyên hỗ trợ cân bằng cảm xúc và tự chăm sóc tinh thần.",
    )
    actions = feature_info.get("actions", []) or []
    categories = feature_info.get("categories", []) or []

    action_text = ", ".join(actions[:3]) if actions else "tìm kiếm và mở tài nguyên"
    category_text = ", ".join(categories[:4]) if categories else "nhiều nhóm nội dung"

    example_resources = []
    for item in (resources or [])[:3]:
        title = (item or {}).get("title")
        if isinstance(title, str) and title.strip():
            example_resources.append(title.strip())

    example_text = ""
    if example_resources:
        example_text = (
            "\n\nVí dụ tài nguyên hiện có: "
            + "; ".join(f"'{title}'" for title in example_resources)
            + "."
        )

    bot_reply = (
        f"{feature_name} là một mục trong hệ thống dùng để người dùng tìm và sử dụng các tài nguyên hỗ trợ chăm sóc sức khỏe tinh thần. "
        f"{summary}\n\n"
        "Bạn có thể vào mục Thư viện chữa lành trong ứng dụng để sử dụng. "
        f"Phạm vi sử dụng: {availability}.\n"
        f"Trong mục này, bạn có thể {action_text}.\n"
        f"Các nhóm nội dung chính hiện có gồm: {category_text}."
        f"{example_text}\n\n"
        "Nếu bạn muốn, mình có thể gợi ý nhanh nên bắt đầu từ mục Thiền, Hít thở, Bài viết hay Video tùy theo nhu cầu hiện tại của bạn.\n\n"
        "[Mở Thư viện chữa lành](/dashboard/resources)"
    )

    return {"bot_reply": bot_reply, "recommendations": []}


def _normalize(values: List[float]) -> List[float]:
    if not values:
        return []
    v_min = min(values)
    v_max = max(values)
    if v_min == v_max:
        return [1.0 for _ in values]
    return [(v - v_min) / (v_max - v_min) for v in values]


def _rule_score_resource(message: str, resource: Dict[str, Any]) -> float:
    msg = (message or "").lower()
    title = str(resource.get("title", "")).lower()
    description = str(resource.get("description", "")).lower()
    category = str(resource.get("category", "")).lower()
    resource_type = str(resource.get("type", "")).lower()
    haystack = f"{title} {description} {category} {resource_type}"

    score = 0.0
    tokens = [token for token in msg.split() if len(token) > 2]
    for token in tokens:
        if token in haystack:
            score += 1.0

    if ("thiền" in msg or "thien" in msg) and ("thiền" in haystack or "res_meditation" in haystack):
        score += 3.0
    if ("hít thở" in msg or "hit tho" in msg) and ("hít thở" in haystack or "res_breathing" in haystack):
        score += 3.0
    if ("bài viết" in msg or "article" in msg) and ("type_article" in haystack or "bài viết" in haystack):
        score += 2.0
    if "video" in msg and ("type_video" in haystack or "video" in haystack):
        score += 2.0

    return score


def _cosine_similarity(vec_a: List[float], vec_b: List[float]) -> float:
    if not vec_a or not vec_b or len(vec_a) != len(vec_b):
        return 0.0
    dot = sum(a * b for a, b in zip(vec_a, vec_b))
    norm_a = math.sqrt(sum(a * a for a in vec_a))
    norm_b = math.sqrt(sum(b * b for b in vec_b))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)


def _resource_to_text(resource: Dict[str, Any]) -> str:
    return " ".join(
        [
            str(resource.get("title", "")),
            str(resource.get("description", "")),
            str(resource.get("category", "")),
            str(resource.get("type", "")),
        ]
    ).strip()


def rank_resources_for_message(
    message: str,
    resources: List[Dict[str, Any]],
    embedding_provider: Optional[EmbeddingProvider] = None,
) -> List[Dict[str, Any]]:
    """
    Minimal semantic retrieval:
    - primary: cosine similarity on embeddings (if provider works)
    - fallback: keyword-based rule score
    - blend: 0.65 semantic + 0.35 rule
    """
    valid = [item for item in resources if isinstance(item, dict) and item.get("title")]
    if not valid:
        return []

    rule_scores = [_rule_score_resource(message, item) for item in valid]
    rule_norm = _normalize(rule_scores)

    semantic_norm = [0.0 for _ in valid]
    if embedding_provider:
        query_vector = embedding_provider(message)
        if query_vector:
            semantic_scores = []
            for item in valid:
                resource_vector = embedding_provider(_resource_to_text(item))
                semantic_scores.append(_cosine_similarity(query_vector, resource_vector or []))
            semantic_norm = _normalize(semantic_scores)

    ranked = []
    for idx, item in enumerate(valid):
        blended = 0.65 * semantic_norm[idx] + 0.35 * rule_norm[idx]
        enriched = dict(item)
        enriched["_rank_score"] = round(blended, 6)
        ranked.append(enriched)

    ranked.sort(key=lambda x: x.get("_rank_score", 0.0), reverse=True)

    clean = []
    for item in ranked:
        row = dict(item)
        row.pop("_rank_score", None)
        clean.append(row)
    return clean


def build_healing_library_material_reply(
    message: str,
    feature_info: Dict[str, Any],
    resources: List[Dict[str, Any]],
    embedding_provider: Optional[EmbeddingProvider] = None,
    avoid_repeat: bool = False,
) -> Dict[str, Any]:
    _ = feature_info

    ranked = rank_resources_for_message(message, resources or [], embedding_provider=embedding_provider)

    # Nếu không có resources cụ thể, vẫn gợi ý categories có sẵn
    if not ranked:
        # Kiểm tra xem có categories nào trong resources để gợi ý
        categories = set()
        for item in (resources or []):
            cat = str(item.get("category", "")).strip()
            if cat:
                categories.add(cat)

        category_suggestions = {
            "RES_MEDITATION": "Thiền",
            "RES_BREATHING": "Hít thở",
            "RES_ARTICLE": "Bài viết",
            "RES_VIDEO": "Video",
            "RES_MUSIC": "Âm nhạc",
        }

        if categories:
            available = [category_suggestions.get(c, c) for c in categories if c in category_suggestions]
            if available:
                cat_text = ", ".join(available)
                if avoid_repeat:
                    bot_reply = (
                        f"Thư viện có các nhóm: {cat_text}. "
                        "Bạn có thể mở Thư viện chữa lành để xem và chọn bài phù hợp với nhu cầu nhé.\n\n"
                        "[Mở Thư viện chữa lành](/dashboard/resources)"
                    )
                else:
                    bot_reply = (
                        f"Mình gợi ý bạn bắt đầu với các nhóm trong Thư viện chữa lành: {cat_text}.\n"
                        "Bạn có thể mở Thư viện chữa lành để xem chi tiết từng bài và chọn bài phù hợp với mình nhé.\n\n"
                        "[Mở Thư viện chữa lành](/dashboard/resources)"
                    )
                return {"bot_reply": bot_reply, "recommendations": []}

        # Fallback khi hoàn toàn không có resources
        bot_reply = (
            "Hiện mình chưa lấy được danh sách tài liệu cụ thể từ Thư viện chữa lành. "
            "Bạn có thể mở Thư viện chữa lành để xem các bài tập thiền, hít thở, bài viết và video nhé.\n\n"
            "[Mở Thư viện chữa lành](/dashboard/resources)"
        )
        return {"bot_reply": bot_reply, "recommendations": []}

    top_resources = ranked[:3]
    lines = []
    for idx, item in enumerate(top_resources, start=1):
        title = str(item.get("title", "Tài liệu"))
        description = str(item.get("description", "")).strip()
        resource_id = str(item.get("id") or item.get("resourceId") or "")

        # Giới hạn độ dài description để text không bị mắc
        short_desc = description[:60] + "..." if len(description) > 60 else description

        line = f"{idx}. {title}"
        if short_desc:
            line += f"\n   {short_desc}"

        # Tạo Markdown link đúng format cho frontend
        if resource_id:
            line += f"\n   [→ Mở bài](/dashboard/resources/{resource_id})"

        lines.append(line)

    if avoid_repeat:
        intro = "Mình gợi ý thêm một hướng khác từ Thư viện chữa lành để bạn dễ chọn hơn:\n"
        outro = (
            "\n\nBạn vào Thư viện chữa lành để lọc sâu hơn theo nhu cầu hiện tại "
            "(thiền, hít thở, bài viết, video) nhé."
            "\n[Mở Thư viện chữa lành](/dashboard/resources)"
        )
    else:
        intro = "Mình đã tìm thấy một số tài liệu phù hợp cho bạn trong Thư viện chữa lành:\n"
        outro = "\n\nBạn có thể mở Thư viện chữa lành để xem thêm và lọc theo chủ đề.\n[Mở Thư viện chữa lành](/dashboard/resources)"

    bot_reply = intro + "\n".join(lines) + outro
    return {"bot_reply": bot_reply, "recommendations": []}
