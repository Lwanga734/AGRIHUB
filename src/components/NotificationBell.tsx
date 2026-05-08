import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useAppDispatch } from '../store/hooks';
import type { RootState } from '../store/store';
import { fetchNotifications, markRead, markAllRead } from '../features/notifications/notificationsSlice';
import type { NotificationType } from '../features/notifications/notifications.types';

const TYPE_STYLES: Record<NotificationType, { icon: string; color: string }> = {
  produce:     { icon: '📦', color: 'bg-green-100 text-green-700' },
  price:       { icon: '🏷️', color: 'bg-amber-100 text-amber-700' },
  transaction: { icon: '💰', color: 'bg-blue-100 text-blue-700' },
  quality:     { icon: '✅', color: 'bg-purple-100 text-purple-700' },
  system:      { icon: '🔔', color: 'bg-gray-100 text-gray-700' },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)   return 'just now';
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export default function NotificationBell() {
  const dispatch   = useAppDispatch();
  const navigate   = useNavigate();
  const [open, setOpen] = useState(false);
  const ref        = useRef<HTMLDivElement>(null);

  const { items, unreadCount, isLoading } = useSelector(
    (state: RootState) => state.notifications
  );

  // Fetch on mount and every 60 seconds
  useEffect(() => {
    dispatch(fetchNotifications());
    const interval = setInterval(() => dispatch(fetchNotifications()), 60_000);
    return () => clearInterval(interval);
  }, [dispatch]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleClick = (item: typeof items[0]) => {
    if (!item.is_read) dispatch(markRead(item.id));
    if (item.link) { navigate(item.link); setOpen(false); }
  };

  return (
    <div className="relative" ref={ref}>
      {/* Bell button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
        aria-label="Notifications"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold leading-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl border border-gray-100 shadow-xl z-50 overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
              {unreadCount > 0 && (
                <span className="text-xs px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 font-medium">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={() => dispatch(markAllRead())}
                className="text-xs text-green-600 hover:underline font-medium"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto divide-y divide-gray-50">
            {isLoading && items.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-400">Loading…</div>
            ) : items.length === 0 ? (
              <div className="py-10 text-center">
                <div className="text-3xl mb-2">🔔</div>
                <p className="text-sm text-gray-500">No notifications yet</p>
              </div>
            ) : (
              items.map((item) => {
                const style = TYPE_STYLES[item.type] ?? TYPE_STYLES.system;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleClick(item)}
                    className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition flex gap-3 items-start
                      ${!item.is_read ? 'bg-blue-50/40' : ''}`}
                  >
                    {/* Icon */}
                    <span className={`text-base w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${style.color}`}>
                      {style.icon}
                    </span>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm leading-tight ${!item.is_read ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                          {item.title}
                        </p>
                        {!item.is_read && (
                          <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 leading-snug line-clamp-2">
                        {item.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">{timeAgo(item.created_at)}</p>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50">
              <p className="text-xs text-gray-400 text-center">
                Showing latest {items.length} notifications
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
