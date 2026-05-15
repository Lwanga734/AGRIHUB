import { api } from '../../lib/api';
import type { Notification } from './notifications.types';

export const notificationsService = {
  async getAll(): Promise<{ notifications: Notification[]; unread_count: number }> {
    const { data } = await api.get('/notifications/index.php?limit=30');
    return data;
  },

  async markRead(id: number): Promise<void> {
    await api.post('/notifications/mark_read.php', { id });
  },

  async markAllRead(): Promise<void> {
    await api.post('/notifications/mark_read.php', { id: 0 });
  },
};
