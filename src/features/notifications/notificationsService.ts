import axios from 'axios';
import type { Notification } from './notifications.types';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost/agrihub';

const api = axios.create({ baseURL: API_BASE });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('agrihub_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

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
