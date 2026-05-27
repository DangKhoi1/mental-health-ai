import { useEffect, useRef, useState } from "react";
import { SendHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface ChatInputProps {
    onSendMessage: (message: string) => void;
    isLoading: boolean;
}

const MAX_WORDS = 2000;

function countWords(text: string): number {
    const trimmed = text.trim();
    if (!trimmed) return 0;
    return trimmed.split(/\s+/).filter(Boolean).length;
}

export function ChatInput({ onSendMessage, isLoading }: ChatInputProps) {
    const [input, setInput] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);
    const wordCount = countWords(input);
    const isTooLong = wordCount > MAX_WORDS;
    const [hasWarnedTooLong, setHasWarnedTooLong] = useState(false);

    useEffect(() => {
        if (isTooLong && !hasWarnedTooLong) {
            toast.error("Nội dung quá dài, vui lòng rút gọn.");
            setHasWarnedTooLong(true);
        }
        if (!isTooLong && hasWarnedTooLong) {
            setHasWarnedTooLong(false);
        }
    }, [isTooLong, hasWarnedTooLong]);

    const handleSend = () => {
        if (!input.trim() || isLoading) return;
        if (isTooLong) {
            toast.error("Nội dung quá dài, vui lòng rút gọn.");
            return;
        }
        onSendMessage(input);
        setInput("");
        inputRef.current?.focus();
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="p-3 border-t bg-background">
            <div className="flex items-center gap-2">
                <Input
                    ref={inputRef}
                    placeholder="Nhập tin nhắn..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isLoading}
                    aria-invalid={isTooLong}
                    className="flex-1"
                />
                <Button
                    size="icon"
                    onClick={handleSend}
                    disabled={!input.trim() || isLoading}
                    className="shrink-0"
                    title={isTooLong ? "Nội dung quá dài — rút gọn rồi gửi nhé" : "Gửi"}
                >
                    <SendHorizontal size={18} />
                </Button>
            </div>

            <div className="mt-1.5 flex items-center justify-between gap-2 px-0.5">
                <p className={isTooLong ? "text-xs text-red-500" : "text-xs text-muted-foreground"}>
                    {isTooLong
                        ? `Bạn đang vượt ${MAX_WORDS} từ ,  hãy tóm gọn lại một chút nhé.`
                        : "Bạn có thể chia nhỏ ý nếu muốn trợ lý trả lời chi tiết hơn."}
                </p>
                <span className={isTooLong ? "text-xs font-medium text-red-500 tabular-nums" : "text-xs text-muted-foreground tabular-nums"}>
                    {wordCount}/{MAX_WORDS} từ
                </span>
            </div>
        </div>
    );
}
