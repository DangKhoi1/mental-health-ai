import json
import random
import re
import traceback
import unicodedata
from typing import Any, Dict, List

from fastapi import FastAPI
import uvicorn

from .core.config import OPENAI_API_KEY, MODEL
from .schemas import ChatRequest, ChatResponse, SentimentResult
from .services.healing_library import (
    build_healing_library_feature_reply,
    build_healing_library_material_reply,
    is_healing_library_feature_question,
    is_healing_library_material_request,
    is_routine_2week_request,
)
from .services.openai_utils import (
    create_chat_completion,
    create_embedding,
    get_openai_client,
)
from .services.prompts import (
    get_chat_system_prompt_with_resources,
    get_off_topic_reply,
    get_recommendations_system_prompt,
    get_reflection_letter_system_prompt,
    get_system_prompt,
    is_off_topic,
)
from .services.recommendation_engine import (
    build_default_recommendations,
    needs_actionable_recommendations,
    rerank_recommendations_hybrid,
)
from .services.response_generator import generate_response
from .services.sentiment import analyze_sentiment


app = FastAPI(
    title="Mental Health Chatbot AI",
    description="Chatbot hỗ trợ tinh thần dựa trên phân tích cảm xúc và OpenAI",
    version="2.1",
)


def _safe_hybrid_rerank(
    recommendations: List[Dict[str, Any]],
    message: str,
    context: Dict[str, Any],
    history: List[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    try:
        return rerank_recommendations_hybrid(
            recommendations,
            message=message,
            context=context,
            history=history,
        )
    except Exception:
        return recommendations if isinstance(recommendations, list) else []


def _get_embedding_provider():
    def provider(text: str):
        if not OPENAI_API_KEY:
            return None
        client = get_openai_client(OPENAI_API_KEY)
        return create_embedding(client, text)

    return provider


def _assessment_fallback_reply(level: str) -> str:
    level_upper = level.upper() if isinstance(level, str) else "MODERATE"

    if "MINIMAL" in level_upper or "TỐI THIỂU" in level_upper:
        return """Tuyệt vời! Sức khỏe tinh thần của bạn đang ở trạng thái rất tốt (Mức độ: Tối thiểu).

**Khuyến nghị duy trì:**
- Trân trọng những khoảnh khắc tích cực mỗi ngày.
- Đảm bảo duy trì thói quen ngủ nghỉ hợp lý và vận động nhẹ nhàng.
- Theo dõi định kỳ để hiểu rõ bản thân hơn.

Bạn có muốn mình chia sẻ thêm vài mẹo nhỏ để giữ vững tinh thần thoải mái này không?"""

    if "MILD" in level_upper or "NHẸ" in level_upper:
        return """Dựa trên kết quả đánh giá (Mức độ: Nhẹ), có vẻ bạn đang gặp chút căng thẳng nhưng vẫn trong tầm kiểm soát.

**Khuyến nghị trong tuần tới:**
- Dành ra 15 phút mỗi tối để làm việc mình thích (đọc sách, nghe nhạc).
- Thử tập các bài hít thở sâu 4-4-6 khi cảm thấy áp lực.
- Tránh làm việc thiết bị điện tử 1 tiếng trước khi ngủ.

Bạn có cần mình hướng dẫn cụ thể bài tập hít thở thư giãn không?"""

    if "MODERATE" in level_upper or "TRUNG BÌNH" in level_upper:
        return """Dựa trên kết quả (Mức độ: Trung Bình), hiện tại bạn đang chịu khá nhiều áp lực định kỳ.

**Lộ trình 2 tuần tới:**
*Tuần 1: Ổn định*
- Ghi chép nhật ký cảm xúc để tìm ra nguyên nhân khiến bạn mệt mỏi nhất.
- Yêu cầu sự giúp đỡ từ bạn bè hoặc đồng nghiệp trong các công việc quá tải.

*Tuần 2: Phục hồi*
- Thực hành chia sẻ cảm xúc với ít nhất 1 người đáng tin cậy.
- Đi dạo hoặc vận động ngoài trời 30 phút mỗi ngày.

Mình luôn ở đây lắng nghe, bạn có muốn kể chi tiết điều gì đang khiến bạn trăn trở không?"""

    return """Kết quả đánh giá cho thấy bạn đang trải qua khoảng thời gian vô cùng khó khăn (Mức độ: Khá nghiêm trọng/Nghiêm trọng). Mình rất tiếc khi nghe điều này.

**Hành động khẩn cấp:**
- Đừng cố gắng vượt qua một mình. Hãy tìm kiếm sự hỗ trợ chuyên môn từ bác sĩ tâm lý hoặc tổng đài tư vấn ngay khi có thể.
- Tạm gác lại mọi áp lực không thiết yếu để ưu tiên nghỉ ngơi tuyệt đối.
- Ở cạnh người thân hoặc bạn bè mà bạn tin tưởng nhất lúc này.

Bạn rất dũng cảm khi đối diện với cảm xúc của mình. Bạn có muốn mình cung cấp một số thông tin liên hệ chuyên gia hoặc tổ chức hỗ trợ không?"""


def _strip_accents(text: str) -> str:
    normalized = unicodedata.normalize("NFD", text or "")
    return "".join(ch for ch in normalized if unicodedata.category(ch) != "Mn")


def _normalize_intent_text(text: str) -> str:
    cleaned = _strip_accents((text or "").lower())
    cleaned = re.sub(r"[^a-z0-9\s]", " ", cleaned)
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned


def _token_jaccard_similarity(a: str, b: str) -> float:
    tokens_a = {token for token in a.split() if len(token) > 1}
    tokens_b = {token for token in b.split() if len(token) > 1}
    if not tokens_a or not tokens_b:
        return 0.0
    inter = len(tokens_a.intersection(tokens_b))
    union = len(tokens_a.union(tokens_b))
    return inter / union if union else 0.0


def _latest_history_text(history: List[Dict[str, Any]], role: str) -> str:
    for item in reversed(history or []):
        if item.get("role") == role and isinstance(item.get("content"), str):
            return item.get("content", "")
    return ""


def _is_same_meaning_as_previous_user_message(message: str, history: List[Dict[str, Any]]) -> bool:
    current = _normalize_intent_text(message)
    if not current:
        return False

    previous = ""
    for item in reversed(history or []):
        if item.get("role") != "user":
            continue
        candidate = _normalize_intent_text(str(item.get("content") or ""))
        if not candidate:
            continue
        # Skip current message if backend already appended it into history.
        if candidate == current:
            continue
        previous = candidate
        break

    if not previous:
        return False

    if current == previous:
        return True
    if len(current) > 12 and (current in previous or previous in current):
        return True

    return _token_jaccard_similarity(current, previous) >= 0.7


def _repeat_guard_instruction() -> str:
    return (
        "Người dùng đang hỏi lại cùng ý nghĩa với lượt trước. "
        "KHONG duoc lap lai nguyen van cau tra loi truoc do. "
        "Hay tra loi bang goc nhin moi, bo sung thong tin khac hoac buoc hanh dong moi."
    )


def _sanitize_bot_reply(text: str) -> str:
    sanitized = str(text or "")
    # Remove markdown bold markers globally.
    sanitized = re.sub(r"\*\*(.*?)\*\*", r"\1", sanitized)
    sanitized = re.sub(r"__(.*?)__", r"\1", sanitized)
    return sanitized.strip()


def _is_assessment_library_section_question(message: str) -> bool:
    msg = _normalize_intent_text(message)
    if not msg:
        return False

    section_keywords = [
        "muc nao",
        "xem muc nao",
        "nen xem gi",
        "nen hoc gi",
        "chu de nao",
    ]
    score_keywords = ["diem", "diem so", "ket qua", "danh gia", "dua vao diem"]

    return any(k in msg for k in section_keywords) and any(
        k in msg for k in score_keywords
    )


def _build_assessment_library_section_reply(context: Dict[str, Any]) -> str:
    level = str(context.get("level", "")).upper()
    total = context.get("totalScore", "N/A")
    max_score = context.get("maxScore", "N/A")

    if "SEVERE" in level or "MODERATELY_SEVERE" in level:
        sections = [
            "Hít thở: bắt đầu bằng bài 3-5 phút để hạ căng thẳng ngay.",
            "Thiền: chọn bài thiền ngắn có hướng dẫn giọng nói.",
            "Bài viết: đọc các bài về ổn định cảm xúc trong giai đoạn quá tải.",
        ]
    elif "MODERATE" in level:
        sections = [
            "Hít thở: ưu tiên các bài hít thở chậm và đều mỗi ngày.",
            "Thiền: chọn thiền tập trung 5-10 phút.",
            "Video: xem video thực hành thư giãn cơ thể ngắn.",
        ]
    elif "MILD" in level:
        sections = [
            "Thiền: bắt đầu với bài nền tảng 5 phút.",
            "Bài viết: đọc nhóm nội dung giữ thói quen tích cực.",
            "Video: chọn video nhẹ nhàng để duy trì nhịp sinh hoạt tốt.",
        ]
    else:
        sections = [
            "Bài viết: đọc nhóm xây dựng thói quen lành mạnh.",
            "Thiền: thực hành bài ngắn để giữ sự tập trung.",
            "Hít thở: dùng khi cần thư giãn nhanh trong ngày.",
        ]

    return (
        f"Với điểm hiện tại ({total}/{max_score}), bạn nên bắt đầu trong Thư viện chữa lành theo thứ tự sau:\n"
        + "\n".join(f"- {item}" for item in sections)
        + "\n\nNếu muốn, mình có thể gợi ý tiếp 1 lộ trình 7 ngày theo đúng các mục này."
        "\n\n[Mở Thư viện chữa lành](/dashboard/resources)"
    )


def _build_general_library_section_reply() -> str:
    return (
        "Bạn có thể bắt đầu trong Thư viện chữa lành theo thứ tự này:\n"
        "- Hít thở: làm 1 bài ngắn 3-5 phút để ổn định nhịp cảm xúc ngay.\n"
        "- Thiền: chọn bài 5-10 phút để tăng tập trung và thư giãn.\n"
        "- Bài viết hoặc Video: xem thêm hướng dẫn thực hành phù hợp với nhu cầu hiện tại.\n\n"
        "Nếu bạn muốn, mình có thể gợi ý chi tiết 1 lựa chọn cụ thể để bắt đầu ngay hôm nay."
        "\n\n[Mở Thư viện chữa lành](/dashboard/resources)"
    )


def _validate_and_correct_7day_order(text: str) -> str:
    """Kiểm tra và sắp xếp lại thứ tự Ngày nếu bị lộn."""
    lines = text.split('\n')
    day_items = []
    other_lines = []
    
    # Regex để tìm dòng "Ngày X-Y:" hoặc "Ngày X:"
    day_pattern = r"^-?\s*Ngày\s+(\d+(?:-\d+)?)\s*:"
    
    for line in lines:
        match = re.match(day_pattern, line.strip())
        if match:
            day_range = match.group(1)
            # Lấy số ngày đầu tiên để dùng cho sắp xếp
            first_day = int(day_range.split('-')[0])
            day_items.append((first_day, line))
        else:
            other_lines.append(line)
    
    # Nếu không có dòng ngày hoặc có ít hơn 3 dòng, return nguyên bản
    if len(day_items) < 3:
        return text
    
    # Kiểm tra nếu đơn hàng bị lộn (so sánh với thứ tự kỳ vọng 1,3,5,6,7 hoặc 1,2,3,4,5,6,7)
    day_numbers = [d[0] for d in day_items]
    expected_order = sorted(day_numbers)
    
    if day_numbers == expected_order:
        # Thứ tự đúng rồi
        return text
    
    # Sắp xếp lại
    day_items.sort(key=lambda x: x[0])
    sorted_lines = [item[1] for item in day_items]
    
    # Ghép lại với các dòng khác (lấy dòng khác từ cuối cùng nếu có)
    result_lines = sorted_lines + other_lines
    return '\n'.join(result_lines)


def _build_7day_library_plan_reply(context: Dict[str, Any]) -> str:
    level = str(context.get("level", "")).upper()

    if "SEVERE" in level or "MODERATELY_SEVERE" in level:
        days = [
            "Ngày 1-2: Mở mục Hít thở, chọn bài 3-5 phút và tập 2 lần/ngày.",
            "Ngày 3-4: Thêm 1 bài Thiền ngắn 5 phút vào buổi tối.",
            "Ngày 5: Đọc 1 Bài viết về ổn định cảm xúc và ghi lại 2 ý bạn thấy hữu ích.",
            "Ngày 6: Kết hợp Hít thở + Thiền (mỗi bài 5 phút).",
            "Ngày 7: Xem 1 Video hướng dẫn thư giãn và tự đánh giá cảm xúc trong ngày.",
        ]
    elif "MODERATE" in level:
        days = [
            "Ngày 1-2: Bắt đầu với Hít thở 5 phút vào sáng hoặc tối.",
            "Ngày 3-4: Thực hành Thiền 5-10 phút sau khi hít thở.",
            "Ngày 5: Xem 1 Video thư giãn cơ thể ngắn và làm theo.",
            "Ngày 6: Chọn 1 Bài viết thực hành để áp dụng trong ngày.",
            "Ngày 7: Lặp lại bài bạn thấy hiệu quả nhất và ghi lại thay đổi tâm trạng.",
        ]
    elif "MILD" in level:
        days = [
            "Ngày 1-2: Thiền 5 phút để tạo thói quen ổn định.",
            "Ngày 3-4: Thêm 1 bài Hít thở nhanh khi thấy căng thẳng.",
            "Ngày 5: Đọc 1 Bài viết về duy trì năng lượng tích cực.",
            "Ngày 6: Xem 1 Video nhẹ nhàng và làm theo trong 10 phút.",
            "Ngày 7: Chọn 1 hoạt động phù hợp nhất để duy trì cho tuần sau.",
        ]
    else:
        days = [
            "Ngày 1-2: Đọc 1 Bài viết ngắn về thói quen lành mạnh.",
            "Ngày 3-4: Thực hành Thiền 5 phút mỗi ngày.",
            "Ngày 5: Tập 1 bài Hít thở nhanh khi cần thư giãn.",
            "Ngày 6: Xem 1 Video hướng dẫn và thực hành theo.",
            "Ngày 7: Tổng kết điều hiệu quả nhất để tiếp tục duy trì.",
        ]

    return _validate_and_correct_7day_order(
        "Đây là lộ trình 7 ngày bạn có thể làm ngay trong Thư viện chữa lành:\n"
        + "\n".join(f"- {item}" for item in days)
        + "\n\nNếu muốn, mình sẽ gợi ý luôn bài đầu tiên bạn nên mở ngay bây giờ."
        "\n\n[Mở Thư viện chữa lành](/dashboard/resources)"
    )


def _build_general_7day_library_plan_reply() -> str:
    return _validate_and_correct_7day_order(
        "Đây là lộ trình 7 ngày bắt đầu nhanh trong Thư viện chữa lành:\n"
        "- Ngày 1-2: Hít thở 3-5 phút mỗi ngày.\n"
        "- Ngày 3-4: Thiền 5-10 phút.\n"
        "- Ngày 5: Đọc 1 bài viết thực hành.\n"
        "- Ngày 6: Xem 1 video hướng dẫn ngắn.\n"
        "- Ngày 7: Lặp lại nội dung bạn thấy hiệu quả nhất.\n\n"
        "Nếu muốn, mình sẽ gợi ý bài đầu tiên để bạn bắt đầu ngay."
        "\n\n[Mở Thư viện chữa lành](/dashboard/resources)"
    )


def _build_2week_routine_with_assessment(context: Dict[str, Any], assessment_title: str = "bài đánh giá") -> str:
    """Build a structured 2-week routine/plan based on assessment level."""
    level = str(context.get("level", "")).upper()
    score = context.get("totalScore", "N/A")
    max_score = context.get("maxScore", "N/A")
    
    if "SEVERE" in level or "MODERATELY_SEVERE" in level:
        week1 = [
            "Ngày 1-2: Hít thở sâu 3-5 phút, 2 lần/ngày (sáng và tối). Ghi lại cảm xúc sau mỗi lần.",
            "Ngày 3-4: Thiền 5-10 phút với hướng dẫn từ Thư viện chữa lành.",
            "Ngày 5: Đọc 1 bài viết về kiểm soát cảm xúc. Ghi 3 điều học được.",
            "Ngày 6: Kết hợp Hít thở + Thiền, mỗi bài 5 phút.",
            "Ngày 7: Xem 1 video thư giãn và tự kết luận những gì hiệu quả nhất.",
        ]
        week2 = [
            "Ngày 8-9: Tăng thời gian Thiền lên 10-15 phút. Thêm nhật ký cảm xúc chi tiết.",
            "Ngày 10-11: Học 1 kỹ thuật quản lý lo âu từ bài viết hoặc video, luyện tập 2-3 lần/ngày.",
            "Ngày 12: Chia sẻ cảm xúc hoặc kinh nghiệm với 1 người tin tưởng.",
            "Ngày 13: Làm lại một bài tập bạn thấy hữu ích nhất từ tuần 1.",
            "Ngày 14: Tổng kết thay đổi, nếu cần gặp chuyên gia hoặc tiếp tục quy trình.",
        ]
    elif "MODERATE" in level:
        week1 = [
            "Ngày 1-2: Hít thở 5 phút mỗi sáng hoặc tối.",
            "Ngày 3-4: Thiền 5-10 phút, tối ưu hóa không gian yên tĩnh.",
            "Ngày 5: Đọc 1 bài viết về quản lý căng thẳng. Ghi 2-3 ý chính.",
            "Ngày 6: Xem 1 video thư giãn cơ thể ngắn (10-15 phút).",
            "Ngày 7: Chọn 1 hoạt động bạn thích nhất và luyện tập 1 tuần.",
        ]
        week2 = [
            "Ngày 8-9: Tiếp tục Thiền nhưng tăng thời gian lên 10-15 phút.",
            "Ngày 10-11: Thêm 1 hoạt động mới (yoga nhẹ, âm nhạc thư giãn, hoặc bài tập khác).",
            "Ngày 12: Ghi nhật ký 3 lần bạn thấy cảm xúc tốt hơn trong tuần này.",
            "Ngày 13: Chia sẻ kinh nghiệm với bạn bè hoặc gia đình.",
            "Ngày 14: Lên kế hoạch tiếp tục thực hành hàng tuần.",
        ]
    elif "MILD" in level:
        week1 = [
            "Ngày 1-3: Thiền 5 phút mỗi sáng để tạo thói quen ổn định.",
            "Ngày 4-5: Hít thở nhanh khi cảm thấy căng thẳng (3 phút, cần thiết).",
            "Ngày 6: Đọc 1-2 bài viết về duy trì năng lượng tích cực.",
            "Ngày 7: Xem 1 video nhẹ nhàng và ghi cảm xúc sau đó.",
        ]
        week2 = [
            "Ngày 8-10: Thiền 5-10 phút mỗi ngày, thời gian linh hoạt.",
            "Ngày 11: Thử 1 hoạt động mới (yoga, vẽ, viết, âm nhạc).",
            "Ngày 12-13: Chia sẻ kinh nghiệm tích cực hoặc giúp đỡ người khác.",
            "Ngày 14: Lên kế hoạch duy trì wellness và phát triển thêm.",
        ]
    else:  # MINIMAL
        week1 = [
            "Ngày 1-3: Thiền 5 phút mỗi ngày để làm quen với tâp luyện.",
            "Ngày 4-5: Xem 2-3 bài viết hoặc video cảm hứng ngắn.",
            "Ngày 6-7: Thực hành 1 hoạt động bạn yêu thích (thể dục, sáng tạo) và ghi tâm trạng.",
        ]
        week2 = [
            "Ngày 8-10: Tiếp tục Thiền + thêm hoạt động yêu thích.",
            "Ngày 11-12: Khám phá thêm nội dung mới từ Thư viện chữa lành.",
            "Ngày 13: Chia sẻ cảm hứng hoặc kinh nghiệm tích cực.",
            "Ngày 14: Thiết lập thói quen wellness dài hạn.",
        ]
    
    routine_text = (
        f"Dựa trên kết quả {assessment_title} của bạn ({score}/{max_score} - {level}):\n\n"
        "**TUẦN 1: Ổn định và Xây dựng Thói quen**\n"
        + "\n".join(f"- {item}" for item in week1)
        + "\n\n**TUẦN 2: Mở rộng và Tạo Động lực**\n"
        + "\n".join(f"- {item}" for item in week2)
        + "\n\n💡 **Lưu ý:**\n"
        "- Bắt đầu nhẹ nhàng, không quá áp lực. Từng bước một là tốt nhất.\n"
        "- Tất cả tài liệu/bài tập có sẵn trong Thư viện chữa lành.\n"
        "- Nếu cần tư vấn thêm, hãy liên hệ chuyên gia hoặc bác sĩ.\n\n"
        "[Mở Thư viện chữa lành](/dashboard/resources)"
    )
    
    return _validate_and_correct_7day_order(routine_text)


def _is_affirmative_short_reply(message: str) -> bool:
    msg = _normalize_intent_text(message)
    positives = {
        "co",
        "ok",
        "oke",
        "yes",
        "duoc",
        "duoc ban",
        "dong y",
    }
    return msg in positives


def _last_assistant_invited_library_section(history: List[Dict[str, Any]]) -> bool:
    last_assistant = _normalize_intent_text(_latest_history_text(history, "assistant"))
    if not last_assistant:
        return False

    # Prioritize dedicated follow-up flow that picks the first concrete resource.
    if "chon luon 1 bai dau tien" in last_assistant or "de xuat bai dau tien" in last_assistant:
        return False

    # If assistant already invited a 7-day plan, route to the dedicated follow-up branch.
    if "lo trinh 7 ngay" in last_assistant:
        return False

    library_markers = ["thu vien chua lanh", "thien", "hit tho", "bai viet", "video"]
    invite_markers = ["neu ban muon", "goi y", "nen bat dau tu muc", "bat dau tu muc"]
    return any(m in last_assistant for m in library_markers) and any(
        m in last_assistant for m in invite_markers
    )


def _last_assistant_invited_7day_plan(history: List[Dict[str, Any]]) -> bool:
    last_assistant = _normalize_intent_text(_latest_history_text(history, "assistant"))
    if not last_assistant:
        return False

    # Invitation message mentions 7-day plan but does not yet contain day-by-day steps.
    if "ngay 1" in last_assistant:
        return False

    return "lo trinh 7 ngay" in last_assistant and "neu muon" in last_assistant


def _last_assistant_was_7day_plan(history: List[Dict[str, Any]]) -> bool:
    last_assistant = _normalize_intent_text(_latest_history_text(history, "assistant"))
    if not last_assistant:
        return False
    return "lo trinh 7 ngay" in last_assistant and "ngay 1" in last_assistant


def _build_after_7day_plan_followup() -> str:
    return (
        "Mình đã gửi lộ trình 7 ngày rồi. Bước tiếp theo, bạn chọn 1 trong 3 hướng để mình gợi ý bài cụ thể ngay:\n"
        "- Hít thở\n"
        "- Thiền\n"
        "- Bài viết hoặc Video\n\n"
        "Bạn chỉ cần trả lời tên mục muốn bắt đầu, mình sẽ đề xuất bài đầu tiên phù hợp."
        "\n\n[Mở Thư viện chữa lành](/dashboard/resources)"
    )


def _is_library_section_selection_question(message: str) -> bool:
    msg = _normalize_intent_text(message)
    section_markers = [
        "muc nao",
        "xem muc nao",
        "goi y nen bat dau muc nao",
        "nen bat dau muc nao",
        "nen bat dau tu muc nao",
        "nen xem gi",
        "chu de nao",
    ]
    library_markers = ["thu vien", "thu vien chua lanh"]

    return any(m in msg for m in section_markers) and any(
        m in msg for m in library_markers
    )


def _is_where_to_find_question(message: str) -> bool:
    msg = _normalize_intent_text(message)
    if not msg:
        return False

    where_markers = [
        "tim o dau",
        "o dau",
        "tim nhu nao",
        "xem o dau",
        "co the tim o dau",
        "co the xem o dau",
    ]
    return any(marker in msg for marker in where_markers)


def _extract_library_sections_from_text(text: str) -> List[str]:
    normalized = _normalize_intent_text(text)
    section_matches: List[str] = []

    section_rules = [
        ("Hít thở", ["hit tho", "tho sau", "breathing"]),
        ("Thiền", ["thien", "meditation"]),
        ("Bài viết", ["bai viet", "doc sach", "doc", "journal", "nhat ky"]),
        ("Video", ["video"]),
    ]

    for section_name, markers in section_rules:
        if any(marker in normalized for marker in markers):
            section_matches.append(section_name)

    # Keep order and uniqueness
    deduped: List[str] = []
    for item in section_matches:
        if item not in deduped:
            deduped.append(item)

    return deduped


def _build_library_where_reply_from_history(history: List[Dict[str, Any]]) -> str:
    last_assistant = _latest_history_text(history, "assistant")
    suggested_sections = _extract_library_sections_from_text(last_assistant)
    if not suggested_sections:
        suggested_sections = ["Hít thở", "Thiền", "Bài viết", "Video"]

    section_line = ", ".join(suggested_sections)
    bullet_lines = "\n".join(f"- {section}" for section in suggested_sections)

    return (
        "Bạn có thể tìm các nội dung đó trong mục Thư viện chữa lành của ứng dụng.\n"
        f"Với nhu cầu hiện tại, bạn nên ưu tiên các mục: {section_line}.\n"
        "Mình gợi ý bạn mở theo thứ tự này:\n"
        f"{bullet_lines}\n\n"
        "Nếu bạn muốn, mình có thể chọn luôn 1 bài đầu tiên phù hợp để bạn bắt đầu ngay."
        "\n\n[Mở Thư viện chữa lành](/dashboard/resources)"
    )


def _last_assistant_invited_pick_first_resource(history: List[Dict[str, Any]]) -> bool:
    last_assistant = _normalize_intent_text(_latest_history_text(history, "assistant"))
    if not last_assistant:
        return False

    invite_markers = [
        "chon luon 1 bai dau tien",
        "de xuat bai dau tien",
        "bat dau ngay",
    ]
    return any(marker in last_assistant for marker in invite_markers)


def _resource_matches_section(resource: Dict[str, Any], section: str) -> bool:
    haystack = _normalize_intent_text(
        " ".join(
            [
                str(resource.get("title", "")),
                str(resource.get("description", "")),
                str(resource.get("category", "")),
                str(resource.get("type", "")),
            ]
        )
    )

    section_markers = {
        "Hít thở": ["hit tho", "breathing", "res breathing"],
        "Thiền": ["thien", "meditation", "res meditation"],
        "Bài viết": ["bai viet", "article", "type article"],
        "Video": ["video", "type video"],
    }
    markers = section_markers.get(section, [])
    return any(marker in haystack for marker in markers)


def _build_pick_first_resource_reply(
    resources: List[Dict[str, Any]],
    history: List[Dict[str, Any]],
) -> str:
    valid_resources = [item for item in (resources or []) if isinstance(item, dict)]
    if not valid_resources:
        return (
            "Mình chưa lấy được danh sách tài nguyên cụ thể lúc này. "
            "Bạn mở Thư viện chữa lành và chọn mục Hít thở hoặc Thiền để bắt đầu bài đầu tiên nhé.\n\n"
            "[Mở Thư viện chữa lành](/dashboard/resources)"
        )

    last_assistant = _latest_history_text(history, "assistant")
    preferred_sections = _extract_library_sections_from_text(last_assistant)

    picked: Dict[str, Any] | None = None
    for section in preferred_sections:
        for item in valid_resources:
            if _resource_matches_section(item, section):
                picked = item
                break
        if picked:
            break

    if not picked:
        picked = valid_resources[0]

    title = str(picked.get("title") or "Tài nguyên gợi ý")
    description = str(picked.get("description") or "").strip()
    short_description = description[:140] + ("..." if len(description) > 140 else "")
    resource_id = str(picked.get("id") or picked.get("resourceId") or "")

    reply = f"Mình gợi ý bạn bắt đầu với: {title}."
    if short_description:
        reply += f" {short_description}"
    reply += "\n\nBạn có thể mở mục này trong Thư viện chữa lành và thực hành ngay 5-10 phút."
    if resource_id:
        reply += f"\n[Đi đến bài tập](/dashboard/resources?resourceId={resource_id})"
    return reply


def _dedupe_bot_reply_if_needed(
    bot_reply: str,
    last_assistant_reply: str,
    same_intent_reask: bool,
) -> str:
    if not same_intent_reask:
        return bot_reply

    if not last_assistant_reply:
        return bot_reply

    if _normalize_intent_text(bot_reply) != _normalize_intent_text(last_assistant_reply):
        return bot_reply

    return (
        "Mình hiểu bạn đang hỏi lại cùng ý. Để tránh lặp, mình tóm tắt ngắn theo hướng khác: "
        "hãy thử 1 bước nhỏ có thể làm ngay hôm nay, và nếu cần tài liệu/bài tập cụ thể thì mở Thư viện chữa lành để lọc theo chủ đề phù hợp."
        "\n\n[Mở Thư viện chữa lành](/dashboard/resources)"
    )


def _general_chat_fallback(message: str, mood: str) -> str:
    msg_lower = message.lower()
    if "stress" in msg_lower or "căng thẳng" in msg_lower:
        return random.choice(
            [
                "Khi cảm thấy stress, bạn hãy thử nhắm mắt lại, hít một hơi thật sâu trong 4 giây, giữ 4 giây, và thở ra từ từ 6 giây nhé. Hoặc đơn giản là đứng lên đi dạo một lát, uống một ngụm nước lọc. Mình luôn ở đây nghe bạn kể.",
                "Mình hiểu cảm giác này. Những lúc căng thẳng, hãy ưu tiên bản thân mình trước. Tạm rời xa màn hình 10 phút, nghe một bài nhạc không lời hoặc rửa mặt bằng nước mát nhé. Điều gì đang làm bạn bận tâm nhất lúc này?",
                "Căng thẳng giống như một chiếc lò xo bị ép chặt vậy. Hãy cho phép bản thân bung ra một chút. Mình gợi ý bạn thử đứng lên vươn vai và hít thở sâu 3 lần xem sao nhé.",
            ]
        )
    if "mệt" in msg_lower or "chán" in msg_lower:
        return random.choice(
            [
                "Nghe này, đôi khi cảm thấy mệt mỏi và chán nản là chuyện rất bình thường. Đừng ép bản thân quá. Có lẽ hôm nay cơ thể và tinh thần bạn đang cần nghỉ ngơi. Đi tắm nước ấm, nghe một bản nhạc nhẹ hoặc đi ngủ sớm nhé!",
                "Nếu hôm nay quá mệt mỏi, bạn hoàn toàn có quyền được 'ngắt kết nối' một lúc. Hãy làm gì đó chỉ để chiều chuộng bản thân thôi, dù là ăn một món ngon hay nằm nhắm mắt thư giãn.",
                "Bạn đã vất vả rồi. Hãy tự nhủ rằng 'mình đã làm tốt nhất có thể' và tạm gác lại mọi âu lo. Nghỉ ngơi thật tốt, ngày mai sẽ là một ngày mới trọn vẹn hơn.",
            ]
        )
    if "vui" in msg_lower or "hạnh phúc" in msg_lower or "tuyệt" in msg_lower:
        return random.choice(
            [
                "Chà, thật tuyệt vời! Năng lượng tích cực của bạn truyền sang cả mình đấy. Cảm ơn bạn vì đã chia sẻ niềm vui này. Nhớ giữ gìn và phát huy những điều làm bạn mỉm cười hôm nay nhé!",
                "Nghe bạn nói vui làm mình cũng thấy hạnh phúc lây! Hãy tận hưởng trọn vẹn khoảnh khắc tuyệt vời này nhé. Có điều gì đặc biệt đã giúp hôm nay của bạn trở nên tươi sáng vậy?",
                "Thật tuyệt khi nghe được những điều tích cực từ bạn. Hãy ghi nhớ cảm giác này, nó sẽ là nguồn năng lượng dự trữ cho bạn trong những ngày tiếp theo!",
            ]
        )
    return generate_response(mood)


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    try:
        sentiment = analyze_sentiment(request.message)
        request_context = request.context or {}
        request_history = request.history or []
        same_intent_reask = _is_same_meaning_as_previous_user_message(
            request.message,
            request_history,
        )
        last_assistant_reply = _latest_history_text(request_history, "assistant")
        repeat_guard_note = _repeat_guard_instruction() if same_intent_reask else ""

        # ── Branch 0: Off-topic guard ────────────────────────────────────────────
        if is_off_topic(request.message):
            return ChatResponse(
                sentiment=SentimentResult(score=sentiment["score"], mood=sentiment["mood"]),
                bot_reply=get_off_topic_reply(),
                recommendations=[],
            )

        # ── Branch 1: Dashboard recommendations ────────────────────────────
        action = request_context.get("action", "")
        if action == "generate_dashboard_recommendations":
            stats = request_context.get("stats", {})
            stats_text = json.dumps(stats, ensure_ascii=False, indent=2)
            user_prompt = (
                f"Thống kê 7 ngày qua của người dùng:\n{stats_text}\n\n"
                "Hãy phân tích và trả về đúng 3 lời khuyên cải thiện sức khỏe tinh thần theo format JSON yêu cầu. Nhớ BẤT NGỜ và KHÁC BIỆT so với những lần trước."
            )
            try:
                client = get_openai_client(OPENAI_API_KEY)
                ai_response = create_chat_completion(
                    client=client,
                    model=MODEL,
                    messages=[
                        {"role": "system", "content": get_recommendations_system_prompt()},
                        {"role": "user", "content": user_prompt},
                    ],
                    temperature=0.9,
                    timeout=30.0,
                )
                bot_reply = ai_response.get("bot_reply", "Mình đã xem qua dữ liệu của bạn rồi, đây là vài gợi ý nhỏ hôm nay nhé.")
                recommendations = ai_response.get("recommendations", [])
            except Exception as e:
                print(f"WARNING: OpenAI error (dashboard recommendations): {e}\n{traceback.format_exc()}")
                bot_reply = "Hôm nay mình gợi ý bạn vài điều nhỏ để cảm thấy dễ chịu hơn nha."
                recommendations = [
                    {"title": "Ra công viên đi bộ", "category": "EXERCISE", "content": "Chiều nay rảnh thì ra công viên gần nhà đi bộ 15 phút nhé, vừa hít thở không khí trong lành vừa thư giãn đầu óc."},
                    {"title": "Gọi điện cho mẹ", "category": "SOCIAL", "content": "Nhắn tin hoặc gọi điện cho mẹ hỏi thăm, nghe giọng mẹ là thấy ấm lòng ngay thôi."},
                    {"title": "Viết 3 dòng nhật ký", "category": "JOURNALING", "content": "Tối nay trước khi ngủ, viết nhanh 3 dòng: hôm nay vui gì, mệt gì, và biết ơn gì. Thử xem!"},
                ]

            recommendations = _safe_hybrid_rerank(
                recommendations,
                message=request.message,
                context=request_context,
                history=request_history,
            )

            return ChatResponse(
                sentiment=SentimentResult(score=sentiment["score"], mood=sentiment["mood"]),
                bot_reply=_sanitize_bot_reply(bot_reply),
                recommendations=recommendations,
            )

        # ── Branch 1.5: PRIORITIZE 2-WEEK ROUTINE REQUEST IF ASSESSMENT CONTEXT EXISTS ────────────────────────────
        has_valid_context = bool(request_context and request_context.get("title"))
        is_asking_for_routine = has_valid_context and is_routine_2week_request(request.message)
        
        if is_asking_for_routine:
            # User explicitly asks for a 2-week routine/plan based on assessment result
            bot_reply = _build_2week_routine_with_assessment(
                request_context,
                assessment_title=str(request_context.get("title", "bài đánh giá"))
            )
            return ChatResponse(
                sentiment=SentimentResult(score=sentiment["score"], mood=sentiment["mood"]),
                bot_reply=_sanitize_bot_reply(bot_reply),
                recommendations=[],
            )

        # Prioritize system feature/resource intents even when assessment context exists.
        healing_resources = request_context.get("healingLibrary", [])
        feature_info = request_context.get("healingLibraryFeature", {})
        embedding_provider = _get_embedding_provider()

        # Only process healing library logic if user is authenticated (has feature_info)
        has_healing_library = bool(feature_info) and feature_info.get("name") == "Thư viện chữa lành"

        if has_healing_library and is_healing_library_feature_question(request.message):
            feature_reply = build_healing_library_feature_reply(feature_info, healing_resources)
            return ChatResponse(
                sentiment=SentimentResult(score=sentiment["score"], mood=sentiment["mood"]),
                bot_reply=_sanitize_bot_reply(feature_reply.get("bot_reply", "")),
                recommendations=feature_reply.get("recommendations", []),
            )

        if has_healing_library and is_healing_library_material_request(request.message):
            material_reply = build_healing_library_material_reply(
                request.message,
                feature_info,
                healing_resources,
                embedding_provider=embedding_provider,
                avoid_repeat=same_intent_reask,
            )
            return ChatResponse(
                sentiment=SentimentResult(score=sentiment["score"], mood=sentiment["mood"]),
                bot_reply=_sanitize_bot_reply(material_reply.get("bot_reply", "")),
                recommendations=material_reply.get("recommendations", []),
            )

        if has_healing_library and _is_library_section_selection_question(request.message):
            bot_reply = (
                _build_assessment_library_section_reply(request_context)
                if has_valid_context
                else _build_general_library_section_reply()
            )
            return ChatResponse(
                sentiment=SentimentResult(score=sentiment["score"], mood=sentiment["mood"]),
                bot_reply=_sanitize_bot_reply(bot_reply),
                recommendations=[],
            )

        if has_healing_library and _is_affirmative_short_reply(request.message) and _last_assistant_invited_7day_plan(
            request_history
        ):
            bot_reply = (
                _build_7day_library_plan_reply(request_context)
                if has_valid_context
                else _build_general_7day_library_plan_reply()
            )
            return ChatResponse(
                sentiment=SentimentResult(score=sentiment["score"], mood=sentiment["mood"]),
                bot_reply=_sanitize_bot_reply(bot_reply),
                recommendations=[],
            )

        if has_healing_library and _is_affirmative_short_reply(request.message) and _last_assistant_was_7day_plan(
            request_history
        ):
            return ChatResponse(
                sentiment=SentimentResult(score=sentiment["score"], mood=sentiment["mood"]),
                bot_reply=_sanitize_bot_reply(_build_after_7day_plan_followup()),
                recommendations=[],
            )

        if has_healing_library and _is_affirmative_short_reply(request.message) and _last_assistant_invited_library_section(
            request_history
        ):
            bot_reply = (
                _build_assessment_library_section_reply(request_context)
                if has_valid_context
                else _build_general_library_section_reply()
            )
            return ChatResponse(
                sentiment=SentimentResult(score=sentiment["score"], mood=sentiment["mood"]),
                bot_reply=_sanitize_bot_reply(bot_reply),
                recommendations=[],
            )

        if has_valid_context and _is_assessment_library_section_question(request.message):
            bot_reply = _build_assessment_library_section_reply(request_context)
            return ChatResponse(
                sentiment=SentimentResult(score=sentiment["score"], mood=sentiment["mood"]),
                bot_reply=_sanitize_bot_reply(bot_reply),
                recommendations=[],
            )

        if has_healing_library and _is_where_to_find_question(request.message) and _latest_history_text(
            request_history,
            "assistant",
        ):
            bot_reply = _build_library_where_reply_from_history(request_history)
            return ChatResponse(
                sentiment=SentimentResult(score=sentiment["score"], mood=sentiment["mood"]),
                bot_reply=_sanitize_bot_reply(bot_reply),
                recommendations=[],
            )

        if has_healing_library and _is_affirmative_short_reply(request.message) and _last_assistant_invited_pick_first_resource(
            request_history
        ):
            bot_reply = _build_pick_first_resource_reply(healing_resources, request_history)
            return ChatResponse(
                sentiment=SentimentResult(score=sentiment["score"], mood=sentiment["mood"]),
                bot_reply=_sanitize_bot_reply(bot_reply),
                recommendations=[],
            )

        # ── Branch 2: Assessment & general chat ────────────────────────────
        is_assessment = has_valid_context or "kết quả đánh giá" in request.message.lower()

        if is_assessment:
            level = request_context.get("level", "MODERATE") if request_context else "MODERATE"

            if request_context:
                assessment_info = f"""
Thông tin đánh giá của người dùng:
- Bài đánh giá: {request_context.get('title', 'N/A')}
- Mức độ: {request_context.get('level', 'N/A')}
- Điểm số: {request_context.get('totalScore', 'N/A')}/{request_context.get('maxScore', 'N/A')}
- Thông điệp: {request_context.get('message', 'N/A')}

Người dùng nói: {request.message}

Hãy phân tích kết quả và đưa ra 4 khuyến nghị cụ thể, phù hợp với mức độ nghiêm trọng.
"""
            else:
                assessment_info = f"Người dùng nói: {request.message}\n\nHãy đưa ra lời khuyên và các khuyến nghị phù hợp."

            if repeat_guard_note:
                assessment_info += f"\n\nYêu cầu bổ sung: {repeat_guard_note}"

            try:
                client = get_openai_client(OPENAI_API_KEY)
                ai_response = create_chat_completion(
                    client=client,
                    model=MODEL,
                    messages=[
                        {"role": "system", "content": get_system_prompt(level)},
                        *(
                            [{"role": "system", "content": repeat_guard_note}]
                            if repeat_guard_note
                            else []
                        ),
                        {"role": "user", "content": assessment_info},
                    ],
                    temperature=0.7,
                    timeout=60.0,
                )
                bot_reply = ai_response.get("bot_reply", "Xin lỗi, tôi gặp sự cố kỹ thuật.")
                recommendations = ai_response.get("recommendations", [])

            except Exception as e:
                print(f"WARNING: OpenAI API Error (Assessment): {type(e).__name__}: {e}")
                traceback.print_exc()

                bot_reply = _assessment_fallback_reply(level)
                recommendations = []

            recommendations = _safe_hybrid_rerank(
                recommendations,
                message=request.message,
                context=request_context,
                history=request_history,
            )

        else:
            # ── Branch 3: General chat ──────────────────────────────────────
            personal_stats = request_context.get("personalStats", {})
            user_name = request_context.get("userName", "Người dùng")

            base_prompt = get_system_prompt()

            if personal_stats:
                mood_info = personal_stats.get("moodStats", {})
                recent_thoughts = personal_stats.get("recentThoughts", [])
                stats_str = f"\nThông tin người dùng ({user_name}):"
                if mood_info:
                    stats_str += f"\n- Cảm xúc hôm nay: {mood_info}"
                if recent_thoughts:
                    stats_str += f"\n- Trăn trở gần đây: {recent_thoughts}"
                base_prompt += f"\n\nBối cảnh cá nhân hóa (Hãy sử dụng tinh tế):\n{stats_str}"

            chat_system_prompt = get_chat_system_prompt_with_resources(base_prompt, healing_resources, has_healing_library)

            messages = [{"role": "system", "content": chat_system_prompt}]
            if repeat_guard_note:
                messages.append({"role": "system", "content": repeat_guard_note})
            if request_history:
                for msg in request_history:
                    role = msg.get("role")
                    content = msg.get("content")
                    if role in ["user", "assistant"] and content:
                        messages.append({"role": role, "content": content})
            messages.append({"role": "user", "content": request.message})

            try:
                client = get_openai_client(OPENAI_API_KEY)
                ai_response = create_chat_completion(
                    client=client,
                    model=MODEL,
                    messages=messages,
                    temperature=0.8,
                    timeout=30.0,
                )
                bot_reply = ai_response.get("bot_reply", generate_response(sentiment["mood"]))
                recommendations = ai_response.get("recommendations", [])

                if not isinstance(recommendations, list):
                    recommendations = []

                # Ensure actionable output when user explicitly asks for methods/suggestions.
                if len(recommendations) == 0 and needs_actionable_recommendations(request.message, bot_reply):
                    recommendations = build_default_recommendations(request.message)

                recommendations = _safe_hybrid_rerank(
                    recommendations,
                    message=request.message,
                    context=request_context,
                    history=request_history,
                )

            except Exception as e:
                print(f"WARNING: OpenAI API Error (Chat): {type(e).__name__}: {e}")
                traceback.print_exc()

                bot_reply = _general_chat_fallback(request.message, sentiment["mood"])
                recommendations = []

        bot_reply = _dedupe_bot_reply_if_needed(
            bot_reply,
            last_assistant_reply,
            same_intent_reask,
        )
        bot_reply = _sanitize_bot_reply(bot_reply)

        return ChatResponse(
            sentiment=SentimentResult(score=sentiment["score"], mood=sentiment["mood"]),
            bot_reply=bot_reply,
            recommendations=recommendations,
        )

    except Exception as top_e:
        print(f"CRITICAL ERROR IN /chat: {top_e}")
        traceback.print_exc()
        raise


@app.post("/reflection-letter", response_model=ChatResponse)
async def generate_reflection_letter(request: ChatRequest):
    """Generate a reflection letter from journal entry."""
    try:
        journal_content = request.message
        emotion_label = ""
        context = request.context or {}

        if isinstance(context, dict):
            emotion_label = str(context.get("emotion_label", ""))

        system_prompt = get_reflection_letter_system_prompt().format(
            emotion_label=emotion_label or "không xác định",
            journal_content=journal_content,
        )

        sentiment = analyze_sentiment(journal_content)

        try:
            client = get_openai_client(OPENAI_API_KEY)
            ai_response = create_chat_completion(
                client=client,
                model=MODEL,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": journal_content},
                ],
                temperature=0.8,
                timeout=30.0,
            )
            letter = ai_response.get("letter", "")
        except Exception as e:
            print(f"WARNING: OpenAI error (reflection letter): {e}\n{traceback.format_exc()}")
            letter = (
                "Mình hiểu, những gì bạn đã trải qua không hề dễ dàng. "
                "Cảm xúc của bạn là hoàn toàn tự nhiên, và việc bạn dám đối diện với nó đã là một điều rất dũng cảm. "
                "Có lẽ, giữa những khoảnh khắc khó khăn ấy, bạn đã học được điều gì đó quý giá về chính mình."
            )

        sanitized_letter = _sanitize_bot_reply(letter)

        return ChatResponse(
            sentiment=SentimentResult(score=sentiment["score"], mood=sentiment["mood"]),
            bot_reply=sanitized_letter,
            recommendations=[],
        )

    except Exception as top_e:
        print(f"CRITICAL ERROR IN /reflection-letter: {top_e}")
        traceback.print_exc()
        raise


if __name__ == "__main__":
    uvicorn.run("app.main:app", reload=True, port=5001)
