"use client";

import { useState, useEffect, useCallback } from "react";
import { useChatStore } from "@/stores";
import { ChatWindow } from "./ChatWindow";
import { chatService } from "@/services/chat.service";
import { assessmentService } from "@/services/assessment";
import { toast } from "sonner";
import { v4 as uuidv4 } from 'uuid';
import { ChatSession } from "./ChatSidebar";
import { useAuthStore } from "@/stores/authStore";
import { ChatSession as ChatSessionApi, ChatMessage as ChatMessageApi } from '@/types/chat.types';
import { usePathname } from "next/navigation";
import { Bot, X } from 'lucide-react';
import { cn } from "@/lib/utils";
import { validateAndCorrectDayOrder } from "@/utils/validateDayOrder";

interface Message {
    id: string;
    role: "USER" | "BOT";
    content: string;
}

const MAX_CHAT_INPUT_WORDS = 2000;
const MIN_BOT_TYPING_MS = 900;

const BOT_REPLY_GIBBERISH =
    "Xin lỗi, mình chưa hiểu ý bạn lắm — bạn thử nói lại bằng một vài câu đơn giản hơn được không?";

const BOT_REPLY_SAFETY =
    "Mình cảm ơn bạn đã tin tưởng chia sẻ. Để ưu tiên an toàn cho bạn, mình không thể trao đổi sâu về nội dung có thể gây tổn hại cho bản thân. " +
    "Nếu bạn đang gặp nguy hiểm ngay lúc này, hãy gọi **115** hoặc nhờ người thân ở bên cạnh. " +
    "Khi bạn sẵn sàng, bạn có thể kể thêm: điều gì đang khiến bạn thấy quá tải nhất trong những ngày này?";

function countWords(text: string): number {
    const trimmed = text.trim();
    if (!trimmed) return 0;
    return trimmed.split(/\s+/).filter(Boolean).length;
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function ensureMinDelay(startedAtMs: number, minDelayMs: number): Promise<void> {
    const elapsed = Date.now() - startedAtMs;
    if (elapsed < minDelayMs) {
        await sleep(minDelayMs - elapsed);
    }
}

function isHighRiskContent(text: string): boolean {
    const normalized = text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ')
        .trim();

    // Lightweight client-side safety gate. Backend should still enforce stronger policies.
    const keywords = [
        'tu tu',
        'tu sat',
        'tu hanh ha',
        'tu lam hai',
        'tu gay hai',
        'tu gay thuong',
        'tu cat',
        'cat tay',
        'cat co tay',
        'chet',
        'muon chet',
        'khong muon song',
        'ket thuc',
        'ket lieu',
        'overdose',
        'u?ong thuoc',
        'uong thuoc',
        'nhay lau',
        'nhay cau',
        'treo co',
    ];

    if (keywords.some((k) => normalized.includes(k))) return true;
    // Also catch explicit self-harm intent patterns.
    if (/(muon|dinh|se|sẽ).{0,12}(tu tu|tu sat|chet|ket thuc)/.test(normalized)) return true;
    return false;
}

function isGibberish(text: string): boolean {
    const trimmed = text.trim();
    if (!trimmed) return false;

    // Consider gibberish if very low ratio of letters for a short message.
    const letters = (trimmed.match(/[a-zA-ZÀ-ỹ]/g) || []).length;
    const digits = (trimmed.match(/[0-9]/g) || []).length;
    const symbols = (trimmed.match(/[^0-9a-zA-ZÀ-ỹ\s]/g) || []).length;
    const nonSpace = trimmed.replace(/\s+/g, "").length;
    if (nonSpace === 0) return false;

    const letterRatio = letters / nonSpace;
    const symbolRatio = symbols / nonSpace;

    // Examples: "asdfgh 12345 $%^!!!" => low letter ratio, high symbol/digit mix
    // Keep it conservative to avoid blocking normal Vietnamese.
    if (nonSpace <= 40 && (letterRatio < 0.35 || symbolRatio > 0.35) && (digits + symbols) >= 6) return true;
    return false;
}

function extractGuestBotReply(response: unknown): string | null {
    if (!response || typeof response !== 'object') return null;

    const candidate = response as {
        bot_reply?: unknown;
        reply?: unknown;
        content?: unknown;
        data?: {
            bot_reply?: unknown;
            reply?: unknown;
            content?: unknown;
            data?: {
                bot_reply?: unknown;
                reply?: unknown;
                content?: unknown;
            };
        };
    };

    const direct = candidate.bot_reply;
    const directReply = candidate.reply;
    const directContent = candidate.content;
    const nested = candidate.data?.bot_reply;
    const nestedReply = candidate.data?.reply;
    const nestedContent = candidate.data?.content;
    const deepNested = candidate.data?.data?.bot_reply;
    const deepNestedReply = candidate.data?.data?.reply;
    const deepNestedContent = candidate.data?.data?.content;
    const picked = direct ?? directReply ?? directContent ?? nested ?? nestedReply ?? nestedContent ?? deepNested ?? deepNestedReply ?? deepNestedContent;

    return typeof picked === 'string' && picked.trim().length > 0 ? picked : null;
}

function extractGuestErrorMessage(response: unknown): string {
    if (!response || typeof response !== 'object') {
        return 'Không nhận được phản hồi từ trợ lý AI.';
    }

    const candidate = response as {
        EM?: unknown;
        message?: unknown;
        error?: unknown;
        data?: {
            EM?: unknown;
            message?: unknown;
            error?: unknown;
        };
    };

    const picked = candidate.EM ?? candidate.message ?? candidate.error ?? candidate.data?.EM ?? candidate.data?.message ?? candidate.data?.error;
    return typeof picked === 'string' && picked.trim().length > 0
        ? picked
        : 'Không nhận được phản hồi từ trợ lý AI.';
}

function extractGuestRecommendations(response: unknown): string[] {
    if (!response || typeof response !== 'object') {
        return [];
    }

    const candidate = response as {
        recommendations?: unknown;
        data?: {
            recommendations?: unknown;
            data?: {
                recommendations?: unknown;
            };
        };
    };

    const rawRecommendations =
        candidate.recommendations ??
        candidate.data?.recommendations ??
        candidate.data?.data?.recommendations;

    if (!Array.isArray(rawRecommendations)) {
        return [];
    }

    return rawRecommendations
        .map((item) => {
            if (typeof item === 'string') return item.trim();
            if (!item || typeof item !== 'object') return '';

            const rec = item as {
                title?: unknown;
                content?: unknown;
            };

            const title = typeof rec.title === 'string' ? rec.title.trim() : '';
            const content = typeof rec.content === 'string' ? rec.content.trim() : '';

            if (!content) return '';
            if (title) return `**${title}**: ${content}`;
            return content;
        })
        .filter((text) => text.length > 0);
}

function appendRecommendationsToReply(reply: string, recommendations: string[]): string {
    if (!recommendations.length) {
        return reply;
    }

    const trimmedReply = reply.trim();
    const hasBullets = /\n\s*-\s+/.test(trimmedReply);

    const normalize = (input: string): string =>
        input
            .toLowerCase()
            .replace(/[*_`>#-]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();

    const normalizedReply = normalize(trimmedReply);
    const seen = new Set<string>();
    const uniqueRecommendations = recommendations.filter((line) => {
        const normalizedLine = normalize(line);
        if (!normalizedLine) return false;
        if (seen.has(normalizedLine)) return false;
        if (normalizedReply.includes(normalizedLine)) return false;
        seen.add(normalizedLine);
        return true;
    });

    if (!uniqueRecommendations.length) {
        return trimmedReply;
    }

    const recommendationBlock = uniqueRecommendations.map((line) => `- ${line}`).join('\n');

    if (hasBullets) {
        return trimmedReply;
    }

    return `${trimmedReply}\n\n${recommendationBlock}`;
}

export function Chatbot() {
    const { isOpen, closeChat, toggleChat, initialMessage, setInitialMessage, context } = useChatStore();
    const { isAuthenticated } = useAuthStore();
    const pathname = usePathname();
    const [isLoading, setIsLoading] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);

    // Sessions state
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
    const [sessionsLoaded, setSessionsLoaded] = useState(false);
    const canUseChatHistory = isAuthenticated && pathname.startsWith('/dashboard');

    useEffect(() => {
        if (!canUseChatHistory) {
            // Never keep authenticated chat traces visible outside dashboard mode.
            setSessions([]);
            setCurrentSessionId(null);
            setMessages([]);
            setSessionsLoaded(false);
            return;
        }

        // Trigger re-fetch when user becomes authenticated.
        setSessions([]);
        setCurrentSessionId(null);
        setMessages([]);
        setSessionsLoaded(false);
        closeChat();
    }, [canUseChatHistory, closeChat]);

    const loadSessions = useCallback(async () => {
        try {
            const data = await chatService.getSessions();
            const sessionsArray = Array.isArray(data) ? data : [];
            const mapped: ChatSession[] = sessionsArray.map((s: ChatSessionApi) => ({
                id: s.chatSessionId,
                title: s.title || 'Cuộc trò chuyện',
                date: formatDate(s.createdAt),
            }));
            setSessions(mapped);
            setSessionsLoaded(true);

            // Don't auto-select old session — user starts fresh each time
            // Sessions are loaded for sidebar display only
        } catch (error) {
            console.error('Failed to load sessions:', error);
            // Fallback: don't crash, just show empty
            setSessionsLoaded(true);
        }
    }, []);

    // Load sessions from backend when chat opens
    useEffect(() => {
        if (isOpen && canUseChatHistory && !sessionsLoaded) {
            loadSessions();
        }
    }, [isOpen, canUseChatHistory, sessionsLoaded, loadSessions]);

    const loadMessages = async (sessionId: string) => {
        try {
            const data = await chatService.getHistory(sessionId);
            const messagesArray = Array.isArray(data) ? data : [];
            const mapped: Message[] = messagesArray.map((m: ChatMessageApi) => ({
                id: m.chatMessageId || uuidv4(),
                role: m.senderCode as "USER" | "BOT",
                content: m.content,
            }));
            setMessages(mapped);
        } catch (error) {
            console.error('Failed to load messages:', error);
            setMessages([]);
        }
    };

    const formatDate = (dateStr: string) => {
        try {
            const date = new Date(dateStr);
            const now = new Date();
            const diffMs = now.getTime() - date.getTime();
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

            if (diffDays === 0) return 'Hôm nay';
            if (diffDays === 1) return 'Hôm qua';
            if (diffDays < 7) return `${diffDays} ngày trước`;
            return date.toLocaleDateString('vi-VN');
        } catch {
            return dateStr;
        }
    };

    const handleSendMessage = useCallback(async (content: string) => {
        // Prevent empty or duplicate processing
        if (!content.trim()) return;
        if (countWords(content) > MAX_CHAT_INPUT_WORDS) {
            toast.error("Nội dung quá dài, vui lòng rút gọn.");
            return;
        }

        const userMsg: Message = {
            id: uuidv4(),
            role: "USER",
            content,
        };

        // TC_CBAI_03: High-risk safety gate (client-side)
        if (isHighRiskContent(content)) {
            const startedAt = Date.now();
            setIsLoading(true);
            setMessages((prev) => [...prev, userMsg]);
            try {
                await ensureMinDelay(startedAt, MIN_BOT_TYPING_MS);
                setMessages((prev) => [
                    ...prev,
                    {
                        id: uuidv4(),
                        role: "BOT",
                        content: BOT_REPLY_SAFETY,
                    },
                ]);
            } finally {
                setIsLoading(false);
            }
            return;
        }

        // TC_CBAI_02: Gibberish input fallback (avoid crashing / provide clear prompt)
        if (isGibberish(content)) {
            const startedAt = Date.now();
            setIsLoading(true);
            setMessages((prev) => [...prev, userMsg]);
            try {
                await ensureMinDelay(startedAt, MIN_BOT_TYPING_MS);
                setMessages((prev) => [
                    ...prev,
                    {
                        id: uuidv4(),
                        role: "BOT",
                        content: BOT_REPLY_GIBBERISH,
                    },
                ]);
            } finally {
                setIsLoading(false);
            }
            return;
        }

        const startedAt = Date.now();
        setIsLoading(true);
        try {
            let activeSessionId = currentSessionId;

            // Auto-create session if authenticated but no session exists
            if (canUseChatHistory && !activeSessionId) {
                const newSession = await chatService.createSession();
                const sessionData = newSession as ChatSessionApi;
                const mapped: ChatSession = {
                    id: sessionData.chatSessionId,
                    title: sessionData.title || 'Cuộc trò chuyện mới',
                    date: 'Vừa xong',
                };
                setSessions(prev => [mapped, ...prev]);
                setCurrentSessionId(mapped.id);
                activeSessionId = mapped.id;

                // Important: wait a tick so loadMessages doesn't overwrite our local state 
                // Alternatively, just clear it before appending our new local ones:
                setMessages([]);
            }
            setMessages((prev) => [...prev, userMsg]);

            if (canUseChatHistory && activeSessionId) {
                const response = await chatService.sendMessage(activeSessionId, content, context);
                const botResponse = (response as ChatMessageApi & { botMessage?: ChatMessageApi })?.botMessage || response;
                if (botResponse?.content) {
                    await ensureMinDelay(startedAt, MIN_BOT_TYPING_MS);
                    // Validate và sửa thứ tự ngày nếu cần
                    const validatedContent = validateAndCorrectDayOrder(botResponse.content);
                    const botMsg: Message = {
                        id: botResponse.chatMessageId || uuidv4(),
                        role: "BOT",
                        content: validatedContent,
                    };
                    setMessages((prev) => [...prev, botMsg]);
                }

                // Update session title in sidebar after first message
                // (backend sets title from the first user message)
                setSessions(prev => prev.map(s => {
                    if (s.id === activeSessionId && s.title === 'Cuộc trò chuyện mới') {
                        return {
                            ...s,
                            title: content.length > 50 ? content.substring(0, 50) + '...' : content,
                        };
                    }
                    return s;
                }));
            } else {
                // Fallback to guest AI chat (no auth needed)
                const response = await assessmentService.guestAiChat(content, context);
                let botReply = extractGuestBotReply(response);
                if (botReply) {
                    // Validate và sửa thứ tự ngày nếu cần
                    botReply = validateAndCorrectDayOrder(botReply);
                    const recommendations = extractGuestRecommendations(response);
                    await ensureMinDelay(startedAt, MIN_BOT_TYPING_MS);
                    const botMsg: Message = {
                        id: uuidv4(),
                        role: "BOT",
                        content: appendRecommendationsToReply(botReply, recommendations),
                    };
                    setMessages((prev) => [...prev, botMsg]);
                } else {
                    throw new Error(extractGuestErrorMessage(response));
                }
            }
        } catch (error) {
            console.error(error);
            const message = error instanceof Error && error.message
                ? error.message
                : 'Có lỗi xảy ra khi gửi tin nhắn';

            await ensureMinDelay(startedAt, MIN_BOT_TYPING_MS);
            setMessages((prev) => [
                ...prev,
                {
                    id: uuidv4(),
                    role: 'BOT',
                    content: 'Hiện tại tôi chưa thể phản hồi. Bạn thử lại sau ít phút nhé.',
                },
            ]);
            toast.error(message);
        } finally {
            setIsLoading(false);
        }
    }, [currentSessionId, canUseChatHistory, context]);

    // Handle initial message
    useEffect(() => {
        if (isOpen && initialMessage) {
            handleSendMessage(initialMessage);
            setInitialMessage(null);
        }
    }, [isOpen, initialMessage, handleSendMessage, setInitialMessage]);

    const handleRefresh = () => {
        setMessages([]);
        toast.info("Đã làm mới cuộc trò chuyện");
    };

    const handleSelectSession = async (id: string) => {
        if (!canUseChatHistory) return;
        setCurrentSessionId(id);
        setMessages([]);
        await loadMessages(id);
        toast.info(`Đã chuyển sang phiên chat: ${sessions.find(s => s.id === id)?.title}`);
    };

    const handleNewChat = async () => {
        if (canUseChatHistory) {
            try {
                const newSession = await chatService.createSession();
                const session = newSession as ChatSessionApi;
                const mapped: ChatSession = {
                    id: session.chatSessionId,
                    title: session.title || 'Cuộc trò chuyện mới',
                    date: 'Vừa xong',
                };
                setSessions(prev => [mapped, ...prev]);
                setCurrentSessionId(mapped.id);
                setMessages([]);
                toast.success("Đã tạo cuộc trò chuyện mới");
            } catch (error) {
                console.error('Failed to create session:', error);
                toast.error("Không thể tạo cuộc trò chuyện mới");
            }
        } else {
            // Guest: keep ephemeral one-off chat without session history sidebar.
            setCurrentSessionId(null);
            setMessages([]);
            toast.success("Đã tạo cuộc trò chuyện mới");
        }
    };

    const handleDeleteSession = async (id: string) => {
        try {
            if (canUseChatHistory) {
                await chatService.deleteSession(id);
            }
            setSessions(prev => prev.filter(s => s.id !== id));
            if (currentSessionId === id) {
                const remaining = sessions.filter(s => s.id !== id);
                if (remaining.length > 0) {
                    setCurrentSessionId(remaining[0].id);
                    setMessages([]);
                    await loadMessages(remaining[0].id);
                } else {
                    setCurrentSessionId(null);
                    setMessages([]);
                }
            }
            toast.success("Đã xóa cuộc trò chuyện");
        } catch (error) {
            console.error('Failed to delete session:', error);
            toast.error("Không thể xóa cuộc trò chuyện");
        }
    };

    return (
        <>

            <ChatWindow
                isOpen={isOpen}
                isAuthenticated={canUseChatHistory}
                onClose={closeChat}
                messages={messages}
                isLoading={isLoading}
                onSendMessage={handleSendMessage}
                onRefresh={handleRefresh}
                sessions={canUseChatHistory ? sessions : []}
                currentSessionId={currentSessionId}
                onSelectSession={handleSelectSession}
                onNewChat={handleNewChat}
                onDeleteSession={handleDeleteSession}
            />
        </>
    );
}
