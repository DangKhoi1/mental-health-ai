import json

from app.services.sentiment import analyze_sentiment


CASES = [
    "Tôi cảm thấy rất vui và hạnh phúc hôm nay",
    "Mọi thứ đều ổn, không có gì đặc biệt",
    "Tôi cảm thấy rất bế tắc và mệt mỏi",
    "Tôi không muốn sống nữa",
]


def run_cases() -> None:
    print("=== Vietnamese Sentiment Smoke Test ===")
    for text in CASES:
        result = analyze_sentiment(text)
        print("\nText:", text)
        print("Result:", json.dumps(result, ensure_ascii=False))


if __name__ == "__main__":
    run_cases()
