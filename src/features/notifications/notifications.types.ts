export type NotificationType = 'produce' | 'price' | 'transaction' | 'quality' | 'system';

export interface Notification {
  id: number;
  user_id: number;
  type: NotificationType;
  title: string;
  message: string;
  is_read: boolean;
  link: string | null;
  created_at: string;
}

export interface NotificationsState {
  items: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
}
