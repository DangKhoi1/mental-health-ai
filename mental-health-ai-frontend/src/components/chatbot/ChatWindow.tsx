import { useEffect, useRef, useState } from "react";
import { createPortal } from 'react-dom';
import { X, RefreshCcw, Bot, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { ChatSidebar, ChatSession } from "./ChatSidebar";
import { cn } from "@/lib/utils";

interface Message {
    id: string;
    role: "USER" | "BOT";
    content: string;
}

interface ChatWindowProps {
    isOpen: boolean;
    isAuthenticated: boolean;
    onClose: () => void;
    messages: Message[];
    isLoading: boolean;
    onSendMessage: (message: string) => void;
    onRefresh: () => void;
    sessions: ChatSession[];
    currentSessionId: string | null;
    onSelectSession: (id: string) => void;
    onNewChat: () => void;
    onDeleteSession: (id: string) => void;
}

export function ChatWindow({
    isOpen,
    isAuthenticated,
    onClose,
    messages,
    isLoading,
    onSendMessage,
    onRefresh,
    sessions,
    currentSessionId,
    onSelectSession,
    onNewChat,
    onDeleteSession
}: ChatWindowProps) {
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [showSidebar, setShowSidebar] = useState(() => {
        if (typeof window === 'undefined') return false;
        return window.innerWidth >= 768;
    });

    const closeSidebarOnMobile = () => {
        if (typeof window !== 'undefined' && window.innerWidth < 768) {
            setShowSidebar(false);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen]);

    if (!isOpen) return null;
    if (typeof document === 'undefined') return null;

    const modalContent = (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-300">
            <div className="absolute inset-0" onClick={onClose} />
            <Card className="relative z-50 w-[95vw] md:w-275 h-[85vh] md:h-162.5 shadow-2xl border-white/20 flex flex-col animate-in zoom-in-95 duration-300 overflow-hidden rounded-2xl ring-1 ring-black/5">
                <CardHeader className="flex flex-row items-center justify-between p-4 sm:px-6 border-b bg-linear-to-r from-primary to-primary/80 text-primary-foreground gap-y-0 shrink-0">
                    <div className="flex items-center gap-3">
                        {isAuthenticated && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="mr-2 md:hidden text-primary-foreground hover:bg-white/20"
                                onClick={() => setShowSidebar(!showSidebar)}
                            >
                                <Menu size={20} />
                            </Button>
                        )}
                        <div className="flex items-center justify-center size-10 bg-white/10 backdrop-blur-sm rounded-full ring-2 ring-white/20">
                            <Bot size={22} className="text-white drop-shadow-md" />
                        </div>
                        <div>
                            <CardTitle className="text-lg font-bold tracking-tight">Trợ lý AI</CardTitle>
                            <p className="text-xs text-primary-foreground/90 font-medium opacity-90">Luôn sẵn sàng lắng nghe</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="size-9 rounded-full hover:bg-white/20 text-primary-foreground transition-colors"
                            onClick={onRefresh}
                            title="Làm mới cuộc trò chuyện"
                        >
                            <RefreshCcw size={18} />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="size-9 rounded-full hover:bg-white/20 text-primary-foreground transition-colors"
                            onClick={onClose}
                        >
                            <X size={20} />
                        </Button>
                    </div>
                </CardHeader>

                <div className="flex flex-1 overflow-hidden">
                    {isAuthenticated && showSidebar && (
                        <div
                            className="md:hidden absolute inset-0 z-20 bg-black/10 backdrop-blur-sm"
                            onClick={() => setShowSidebar(false)}
                        />
                    )}

                    {isAuthenticated && (
                        <div className={cn(
                            'md:hidden absolute left-0 top-0 bottom-0 z-30 w-72 max-w-[82vw] border-r border-white/20 bg-background/75 backdrop-blur-xl shadow-2xl transition-transform duration-300 ease-in-out supports-backdrop-filter:bg-background/70',
                            showSidebar ? 'translate-x-0' : '-translate-x-full'
                        )}>
                            <div className="flex h-full flex-col">
                                <div className="flex items-center justify-between border-b border-border/40 p-3">
                                    <div>
                                        <p className="text-sm font-semibold text-foreground">Lịch sử chat</p>
                                        <p className="text-xs text-muted-foreground">Cuộn để chọn phiên trò chuyện</p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="size-9 rounded-full text-muted-foreground hover:bg-background/80 hover:text-foreground"
                                        onClick={() => setShowSidebar(false)}
                                        aria-label="Thu sidebar"
                                        title="Thu sidebar"
                                    >
                                        <X size={18} />
                                    </Button>
                                </div>

                                <ChatSidebar
                                    sessions={sessions}
                                    currentSessionId={currentSessionId}
                                    onSelectSession={(id) => {
                                        onSelectSession(id);
                                        closeSidebarOnMobile();
                                    }}
                                    onNewChat={() => {
                                        onNewChat();
                                        closeSidebarOnMobile();
                                    }}
                                    onDeleteSession={onDeleteSession}
                                />
                            </div>
                        </div>
                    )}

                    {isAuthenticated && (
                        <div className={cn(
                            "transition-all duration-300 ease-in-out border-r border-border/40 bg-muted/30 shrink-0",
                            showSidebar ? "w-72 translate-x-0" : "w-0 -translate-x-full opacity-0 overflow-hidden",
                            "hidden md:block"
                        )}>
                            <ChatSidebar
                                sessions={sessions}
                                currentSessionId={currentSessionId}
                                onSelectSession={(id) => {
                                    onSelectSession(id);
                                    closeSidebarOnMobile();
                                }}
                                onNewChat={() => {
                                    onNewChat();
                                    closeSidebarOnMobile();
                                }}
                                onDeleteSession={onDeleteSession}
                            />
                        </div>
                    )}

                    <div className="flex flex-col flex-1 min-w-0 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
                        <CardContent className="flex-1 overflow-y-auto p-4 sm:p-6 gap-y-6">
                            {messages.length === 0 && (
                                <div className="flex flex-col items-center justify-center h-full text-center gap-y-8 p-4 sm:p-8 opacity-90 pb-20">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
                                        <div className="relative p-6 bg-white dark:bg-zinc-800 rounded-2xl shadow-sm border border-border/50">
                                            <Bot size={56} className="text-primary" />
                                        </div>
                                    </div>
                                    <div className="space-y-3 max-w-md">
                                        <h3 className="font-semibold text-2xl text-foreground">Xin chào!</h3>
                                        <p className="text-muted-foreground text-base leading-relaxed">
                                            Tôi là trợ lý AI sức khỏe tinh thần của bạn.<br />
                                            Hãy chia sẻ bất cứ điều gì bạn đang cảm thấy nhé.
                                        </p>
                                    </div>

                                    <div className="w-full max-w-md pt-4">
                                        <p className="text-sm font-medium text-muted-foreground mb-4 text-left px-2">Gợi ý cho bạn:</p>
                                        <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                                            {[
                                                "Tôi cảm thấy mệt mỏi",
                                                "Hôm nay tôi rất vui",
                                                "Cần làm gì lúc bị stress?",
                                                "Giúp tôi thư giãn",
                                            ].map((suggestion) => (
                                                <Button
                                                    key={suggestion}
                                                    variant="outline"
                                                    size="sm"
                                                    className="rounded-full text-xs font-normal border-primary/20 hover:bg-primary/10 transition-colors"
                                                    onClick={() => onSendMessage(suggestion)}
                                                >
                                                    {suggestion}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {messages.map((msg) => (
                                <ChatMessage key={msg.id} role={msg.role} content={msg.content} />
                            ))}

                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="flex items-center gap-1 bg-muted px-3 py-2 rounded-lg">
                                        <div className="size-1.5 bg-primary/50 rounded-full animate-[pulse_2s_ease-in-out_infinite] [animation-delay:-0.3s]" />
                                        <div className="size-1.5 bg-primary/50 rounded-full animate-[pulse_2s_ease-in-out_infinite] [animation-delay:-0.15s]" />
                                        <div className="size-1.5 bg-primary/50 rounded-full animate-[pulse_2s_ease-in-out_infinite]" />
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </CardContent>

                        <ChatInput onSendMessage={onSendMessage} isLoading={isLoading} />
                    </div>
                </div>
            </Card>
        </div>
    );

    return createPortal(modalContent, document.body);
}
