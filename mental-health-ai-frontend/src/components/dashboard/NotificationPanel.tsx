'use client';

import { useEffect } from 'react';
import { useNotificationStore } from '@/stores/notificationStore';
import { Bell, BellOff, CheckCheck, Trash2, Clock, Info, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

export function NotificationPanel() {
    const {
        notifications,
        isLoading,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        removeNotification,
    } = useNotificationStore();

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        fetchNotifications();
    }, []);

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'REMINDER':
                return <Clock className="size-4 text-blue-500" />;
            case 'WARNING':
                return <AlertTriangle className="size-4 text-amber-500" />;
            case 'SYSTEM':
                return <Bell className="size-4 text-purple-500" />;
            default:
                return <Info className="size-4 text-sky-500" />;
        }
    };

    const formatTime = (dateStr: string) => {
        try {
            return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: vi });
        } catch {
            return dateStr;
        }
    };


    return (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-background border border-border rounded-xl shadow-xl z-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
                <h3 className="text-sm font-semibold text-foreground">Thông báo</h3>
                {notifications.length > 0 && (
                    <button
                        onClick={markAllAsRead}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                        title="Đánh dấu tất cả đã đọc"
                    >
                        <CheckCheck className="size-3.5" />
                        <span>Đọc tất cả</span>
                    </button>
                )}
            </div>

            {/* Content */}
            <div className="max-h-80 overflow-y-auto">
                {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="size-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                        <BellOff className="size-8 mb-2 opacity-50" />
                        <p className="text-sm">Không có thông báo nào</p>
                    </div>
                ) : (
                    notifications.map((notification) => (
                        <div
                            key={notification.notificationId}
                            className={`flex items-start gap-3 px-4 py-3 border-b border-border/50 hover:bg-muted/30 transition-colors cursor-pointer ${!notification.isRead ? 'bg-primary/5' : ''
                                }`}
                            onClick={() => {
                                if (!notification.isRead) {
                                    markAsRead(notification.notificationId);
                                }
                            }}
                        >
                            <div className="mt-0.5 shrink-0">
                                {getTypeIcon(notification.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                    <p className={`text-sm leading-tight ${!notification.isRead ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                                        {notification.title}
                                    </p>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            removeNotification(notification.notificationId);
                                        }}
                                        className="shrink-0 p-1 rounded-md text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 transition-colors"
                                        title="Xóa thông báo"
                                    >
                                        <Trash2 className="size-3.5" />
                                    </button>
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                    {notification.message}
                                </p>
                                <p className="text-[10px] text-muted-foreground/60 mt-1">
                                    {formatTime(notification.createdAt)}
                                </p>
                            </div>
                            {!notification.isRead && (
                                <div className="size-2 rounded-full bg-primary shrink-0 mt-1.5" />
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
