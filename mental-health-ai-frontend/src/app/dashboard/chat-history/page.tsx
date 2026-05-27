'use client';

import React, { useEffect, useState } from 'react';
import { MessageSquare, Trash2, Search, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import {
    Button,
    Card,
    CardContent,
    ConfirmDialog,
    Input,
} from '@/components/ui';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { chatService } from '@/services/chat.service';
import { ChatSession, ChatMessage } from '@/types/chat.types';

export default function ChatHistoryPage() {
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);
    const [sessionMessages, setSessionMessages] = useState<Record<string, ChatMessage[]>>({});
    const [loadingMessages, setLoadingMessages] = useState<Record<string, boolean>>({});
    const [pendingDelete, setPendingDelete] = useState<ChatSession | null>(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        loadSessions();
    }, []);

    const loadSessions = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await chatService.getSessions();
            setSessions(Array.isArray(data) ? data : []);
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Lỗi không xác định';
            toast.error(`Lỗi: ${msg}`);
            setError('Không thể tải lịch sử chat');
            setSessions([]);
        } finally {
            setLoading(false);
        }
    };

    const loadMessages = async (sessionId: string) => {
        if (sessionMessages[sessionId]) return;

        try {
            setLoadingMessages((p) => ({ ...p, [sessionId]: true }));
            const data = await chatService.getHistory(sessionId);
            setSessionMessages((p) => ({ ...p, [sessionId]: Array.isArray(data) ? data : [] }));
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Lỗi không xác định';
            toast.error(`Lỗi: ${msg}`);
        } finally {
            setLoadingMessages((p) => ({ ...p, [sessionId]: false }));
        }
    };

    const handleToggleExpand = async (session: ChatSession) => {
        if (expandedSessionId === session.chatSessionId) {
            setExpandedSessionId(null);
        } else {
            setExpandedSessionId(session.chatSessionId);
            await loadMessages(session.chatSessionId);
        }
    };

    const handleDelete = async (session: ChatSession) => {
        setDeleting(true);
        try {
            await chatService.deleteSession(session.chatSessionId);
            toast.success('Xóa phiên chat thành công');
            setPendingDelete(null);
            await loadSessions();
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Lỗi không xác định';
            toast.error(`Lỗi: ${msg}`);
        } finally {
            setDeleting(false);
        }
    };

    const filteredSessions = sessions.filter((s) =>
        search ? s.title.toLowerCase().includes(search.toLowerCase()) : true,
    );

    const formatTime = (date: string) => {
        try {
            return new Date(date).toLocaleString('vi-VN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch {
            return date;
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight">Lịch sử chat</h1>
                <p className="mt-1 text-slate-600">Xem lại tất cả các cuộc trò chuyện của bạn với trợ lý AI</p>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-slate-400" />
                <Input
                    placeholder="Tìm kiếm phiên chat..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                />
            </div>

            {/* Error Alert */}
            {error && <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}

            {/* Loading */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Spinner />
                </div>
            ) : filteredSessions.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <MessageSquare className="mx-auto mb-4 size-12 text-slate-400" />
                        <p className="text-slate-500">
                            {search ? 'Không tìm thấy phiên chat phù hợp' : 'Chưa có phiên chat nào. Hãy bắt đầu trò chuyện!'}
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {filteredSessions.map((session) => (
                        <Card key={session.chatSessionId} className="overflow-hidden">
                            <div className="flex items-center justify-between p-4">
                                <div className="flex flex-1 items-center gap-3">
                                    <button
                                        onClick={() => handleToggleExpand(session)}
                                        className="p-1 hover:bg-slate-100 rounded"
                                    >
                                        <ChevronDown
                                            size={20}
                                            className={`transition-transform ${expandedSessionId === session.chatSessionId ? 'rotate-180' : ''}`}
                                        />
                                    </button>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-slate-900 truncate">{session.title}</h3>
                                        <p className="text-sm text-slate-600 mt-0.5">
                                            {formatTime(session.createdAt)}
                                        </p>
                                    </div>
                                    <Badge variant={session.isActive ? 'default' : 'secondary'}>
                                        {session.isActive ? 'Đang hoạt động' : 'Đã kết thúc'}
                                    </Badge>
                                </div>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setPendingDelete(session)}
                                    disabled={deleting}
                                >
                                    <Trash2 size={16} className="text-red-600" />
                                </Button>
                            </div>

                            {/* Expanded Messages */}
                            {expandedSessionId === session.chatSessionId && (
                                <div className="border-t bg-slate-50 p-4">
                                    {loadingMessages[session.chatSessionId] ? (
                                        <div className="flex justify-center py-6">
                                            <Spinner />
                                        </div>
                                    ) : (sessionMessages[session.chatSessionId] || []).length === 0 ? (
                                        <p className="text-center text-slate-500 py-4">Không có tin nhắn nào</p>
                                    ) : (
                                        <div className="space-y-3">
                                            {(sessionMessages[session.chatSessionId] || []).map((msg) => (
                                                <div
                                                    key={msg.chatMessageId}
                                                    className={`p-3 rounded ${msg.senderCode === 'USER'
                                                        ? 'bg-blue-100 ml-auto max-w-xs text-right'
                                                        : 'bg-white border border-slate-200 mr-auto max-w-xs'
                                                        }`}
                                                >
                                                    <p className="text-sm font-medium text-slate-600 mb-1">
                                                        {msg.senderCode === 'USER' ? 'Bạn' : 'Trợ lý'}
                                                    </p>
                                                    <p className="text-slate-900 text-sm">{msg.content}</p>
                                                    <p className="text-xs text-slate-500 mt-1">
                                                        {formatTime(msg.createdAt)}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </Card>
                    ))}
                </div>
            )}

            {/* Delete Confirmation */}
            {pendingDelete && (
                <ConfirmDialog
                    open={Boolean(pendingDelete)}
                    title="Xóa phiên chat"
                    description={`Bạn có chắc chắn muốn xóa phiên chat "${pendingDelete.title}"? Hành động này không thể hoàn tác.`}
                    onClose={() => setPendingDelete(null)}
                    onConfirm={() => handleDelete(pendingDelete)}
                    confirmLabel="Xóa"
                    cancelLabel="Hủy"
                />
            )}
        </div>
    );
}
