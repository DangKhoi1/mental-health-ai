import privateAxios from '@/lib/privateAxios';
import { Notification, CreateNotificationDto } from '@/types/notification.types';

type ApiEnvelope<T> = {
  statusCode?: number;
  EC?: number;
  EM?: string;
  data?: T;
};

function unwrapOrThrow<T>(raw: unknown): T {
  const payload = (raw as ApiEnvelope<T>) || {};
  const statusCode = payload.statusCode ?? 200;
  const ec = payload.EC ?? 1;

  if (ec === 0 || statusCode >= 400) {
    throw new Error(payload.EM || 'Notification request failed');
  }

  if (payload.data !== undefined) {
    return payload.data;
  }

  return raw as T;
}

export const notificationService = {
  async getAll(limit = 20, offset = 0): Promise<Notification[]> {
    const response = await privateAxios.get(`/notifications?limit=${limit}&offset=${offset}`);
    return unwrapOrThrow<Notification[]>(response);
  },

  async getReminders(): Promise<Notification[]> {
    const response = await privateAxios.get('/notifications/reminders');
    return unwrapOrThrow<Notification[]>(response);
  },

  async getUnreadCount(): Promise<number> {
    const response = await privateAxios.get('/notifications/unread-count');
    return unwrapOrThrow<number>(response);
  },

  async create(data: CreateNotificationDto): Promise<Notification> {
    const response = await privateAxios.post('/notifications', data);
    return unwrapOrThrow<Notification>(response);
  },

  async markAsRead(id: string): Promise<Notification> {
    const response = await privateAxios.patch(`/notifications/${id}/read`);
    return unwrapOrThrow<Notification>(response);
  },

  async markAllAsRead(): Promise<void> {
    const response = await privateAxios.patch('/notifications/read-all');
    unwrapOrThrow<unknown>(response);
  },

  async toggleActive(id: string): Promise<Notification> {
    const response = await privateAxios.patch(`/notifications/${id}/toggle-active`);
    return unwrapOrThrow<Notification>(response);
  },

  async update(id: string, data: Partial<CreateNotificationDto>): Promise<Notification> {
    const response = await privateAxios.patch(`/notifications/${id}`, data);
    return unwrapOrThrow<Notification>(response);
  },

  async remove(id: string): Promise<void> {
    const response = await privateAxios.delete(`/notifications/${id}`);
    unwrapOrThrow<unknown>(response);
  },
};
