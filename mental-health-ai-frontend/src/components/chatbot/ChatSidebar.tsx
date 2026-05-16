"use client";

import { MessageSquare, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ChatSession {
    id: string;
    title: string;
    date: string;
}

interface ChatSidebarProps {
    sessions: ChatSession[];
    currentSessionId: string | null;
    onSelectSession: (id: string) => void;
    onNewChat: () => void;
    onDeleteSession: (id: string) => void;
}

export function ChatSidebar({
    sessions,
    currentSessionId,
    onSelectSession,
    onNewChat,
    onDeleteSession
}: ChatSidebarProps) {
    return (
        <div className="w-full h-full flex flex-col overflow-hidden">
            <div className="p-3 border-b border-border/40">
                <Button
                    onClick={onNewChat}
                    className="w-full justify-start gap-2 shadow-sm"
                    variant="default"
                >
                    <Plus size={16} />
                    Cuộc trò chuyện mới
                </Button>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col">
                <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Gần đây
                </div>
                <div className="flex-1 overflow-y-auto overflow-x-hidden px-2 pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    {sessions.map((session) => {
                        const isActive = currentSessionId === session.id;

                        return (
                            <div
                                key={session.id}
                                className={cn(
                                    "relative group flex items-center h-9 rounded-lg cursor-pointer mb-0.5",
                                    isActive ? "bg-secondary" : "hover:bg-muted/80"
                                )}
                                onClick={() => onSelectSession(session.id)}
                            >
                                {/* Icon + Title */}
                                <div className="flex items-center gap-2 pl-3 overflow-hidden flex-1 min-w-0 h-full">
                                    <MessageSquare size={14} className={cn(
                                        "shrink-0",
                                        isActive ? "text-primary" : "text-muted-foreground"
                                    )} />
                                    <span
                                        className="text-sm whitespace-nowrap flex-1 min-w-0"
                                        style={{
                                            overflow: 'hidden',
                                            maskImage: 'linear-gradient(to right, black calc(100% - 24px), transparent)',
                                            WebkitMaskImage: 'linear-gradient(to right, black calc(100% - 24px), transparent)',
                                        }}
                                    >
                                        {session.title}
                                    </span>
                                </div>

                                {/* Delete button - always visible */}
                                <button
                                    className="shrink-0 w-7 h-7 flex items-center justify-center rounded-md mr-1 text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 transition-all opacity-0 group-hover:opacity-100"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDeleteSession(session.id);
                                    }}
                                    title="Xóa cuộc trò chuyện"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="p-3 border-t border-border/40 bg-muted/10">
                <p className="text-xs text-center text-muted-foreground">
                    Lịch sử được lưu tự động
                </p>
            </div>
        </div>
    );
}
