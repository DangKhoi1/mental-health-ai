import { create } from 'zustand';
import { notificationService } from '@/services/notification';
import { Notification, CreateNotificationDto } from '@/types/notification.types';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';

let notificationSocket: Socket | null = null;

type NotificationChangedEvent = {
    action:
        | 'created'
        | 'updated'
        | 'deleted'
        | 'read'
        | 'read_all'
        | 'cron_due'
        | 'reminder_rescheduled'
        | 'reminder_enabled'
        | 'reminder_disabled';
    notificationId?: string;
    title?: string;
    message?: string;
    type?: string;
    scheduleTime?: string;
};

const resolveSocketBaseUrl = () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';
    return apiUrl.replace(/\/api\/v\d+\/?$/, '');
};

interface NotificationStore {
    notifications: Notification[];
    reminders: Notification[];
    unreadCount: number;
    isLoading: boolean;
    isRealtimeConnected: boolean;

    fetchNotifications: () => Promise<void>;
    fetchReminders: () => Promise<void>;
    fetchUnreadCount: () => Promise<void>;
    refreshAll: () => Promise<void>;
    createNotification: (data: CreateNotificationDto) => Promise<void>;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    toggleActive: (id: string) => Promise<void>;
    removeNotification: (id: string) => Promise<void>;
    initRealtime: () => void;
    disconnectRealtime: () => void;
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
    notifications: [],
    reminders: [],
    unreadCount: 0,
    isLoading: false,
    isRealtimeConnected: false,

    fetchNotifications: async () => {
        set({ isLoading: true });
        try {
            const notifications = await notificationService.getAll();
            const data = Array.isArray(notifications) ? notifications : [];
            set({ notifications: data });
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            set({ isLoading: false });
        }
    },

    fetchReminders: async () => {
        try {
            const reminders = await notificationService.getReminders();
            const data = Array.isArray(reminders) ? reminders : [];
            set({ reminders: data });
        } catch (error) {
            console.error('Failed to fetch reminders:', error);
        }
    },

    fetchUnreadCount: async () => {
        try {
            const count = await notificationService.getUnreadCount();
            set({ unreadCount: typeof count === 'number' ? count : 0 });
        } catch (error) {
            console.error('Failed to fetch unread count:', error);
        }
    },

    refreshAll: async () => {
        await Promise.all([
            get().fetchNotifications(),
            get().fetchReminders(),
            get().fetchUnreadCount(),
        ]);
    },

    createNotification: async (data: CreateNotificationDto) => {
        await notificationService.create(data);
        await get().fetchNotifications();
        await get().fetchReminders();
        await get().fetchUnreadCount();
    },

    markAsRead: async (id: string) => {
        await notificationService.markAsRead(id);
        set((state) => ({
            notifications: state.notifications.map((n) =>
                n.notificationId === id ? { ...n, isRead: true } : n
            ),
            unreadCount: Math.max(0, state.unreadCount - 1),
        }));
    },

    markAllAsRead: async () => {
        await notificationService.markAllAsRead();
        set((state) => ({
            notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
            unreadCount: 0,
        }));
    },

    toggleActive: async (id: string) => {
        await notificationService.toggleActive(id);
        set((state) => ({
            reminders: state.reminders.map((r) =>
                r.notificationId === id ? { ...r, isActive: !r.isActive } : r
            ),
            notifications: state.notifications.map((n) =>
                n.notificationId === id ? { ...n, isActive: !n.isActive } : n
            ),
        }));
        await get().fetchUnreadCount();
    },

    removeNotification: async (id: string) => {
        await notificationService.remove(id);
        set((state) => ({
            notifications: state.notifications.filter((n) => n.notificationId !== id),
            reminders: state.reminders.filter((r) => r.notificationId !== id),
        }));
        await get().fetchUnreadCount();
    },

    initRealtime: () => {
        if (typeof window === 'undefined') {
            return;
        }

        const accessToken = useAuthStore.getState().accessToken;
        if (!accessToken) {
            return;
        }

        if (notificationSocket && notificationSocket.connected) {
            return;
        }

        if (notificationSocket) {
            notificationSocket.disconnect();
            notificationSocket = null;
        }

        notificationSocket = io(`${resolveSocketBaseUrl()}/notifications`, {
            transports: ['websocket'],
            withCredentials: true,
            auth: {
                token: `Bearer ${accessToken}`,
            },
        });

        notificationSocket.on('connect', () => {
            set({ isRealtimeConnected: true });
        });

        notificationSocket.on('disconnect', () => {
            set({ isRealtimeConnected: false });
        });

        notificationSocket.on('notifications:changed', async (payload: NotificationChangedEvent) => {
            if (payload?.action === 'cron_due') {
                const toastTitle = payload.title || 'Nhắc nhở đã đến giờ';
                const toastMessage =
                    payload.message || 'Đã đến thời điểm thực hiện nhắc nhở này.';
                toast.info(toastTitle, {
                    description: toastMessage,
                });
            }
            await get().refreshAll();
        });
    },

    disconnectRealtime: () => {
        if (notificationSocket) {
            notificationSocket.disconnect();
            notificationSocket = null;
        }
        set({ isRealtimeConnected: false });
    },
}));
