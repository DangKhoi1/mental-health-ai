export interface Notification {
  notificationId: string;
  title: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'REMINDER' | 'SYSTEM';
  scheduleTime?: string;
  isActive: boolean;
  isRead: boolean;
  data?: Record<string, unknown>;
  createdAt: string;
  userId: string;
}

export interface CreateNotificationDto {
  title: string;
  message: string;
  type?: 'INFO' | 'WARNING' | 'REMINDER' | 'SYSTEM';
  scheduleTime?: string;
  isActive?: boolean;
  data?: Record<string, unknown>;
}
