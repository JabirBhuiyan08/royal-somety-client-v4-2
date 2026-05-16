// client/src/pages/Notifications.jsx
import { useEffect, useMemo } from 'react';
import useNotifications from '../hooks/useNotifications';

import { Bell, Info, AlertTriangle, CheckCircle, AlertCircle, Check, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { bn } from 'date-fns/locale';

const typeConfig = {
  info:    { icon: Info,          color: '#2563eb', bg: '#eff6ff' },
  success: { icon: CheckCircle,   color: '#16a34a', bg: '#f0fdf4' },
  warning: { icon: AlertTriangle, color: '#ea580c', bg: '#fff7ed' },
  alert:   { icon: AlertCircle,   color: '#dc2626', bg: '#fef2f2' },
};

const NotificationItem = ({ notification, onMarkRead }) => {
  const cfg = typeConfig[notification.type] || typeConfig.info;
  const Icon = cfg.icon;
  const time = notification.createdAt ? formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: bn }) : '';
  const isUnread = !notification.isRead?.length;

  return (
    <button
      key={notification._id}
      onClick={() => onMarkRead(notification._id)}
      className="w-full text-left p-4 flex gap-3 transition-all duration-200 hover:shadow-md active:scale-[0.99]"
      style={{
        background: isUnread ? `linear-gradient(135deg, #ffffff 0%, ${cfg.bg}60 100%)` : '#ffffff',
        border: isUnread ? `1px solid ${cfg.color}30` : '1px solid #f1f5f9',
        borderRadius: '14px',
        boxShadow: isUnread ? `0 2px 8px ${cfg.color}15` : 'none',
      }}
    >
      {/* Icon */}
      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm"
        style={{ background: cfg.bg }}>
        <Icon size={18} style={{ color: cfg.color }} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-bold text-slate-800 leading-snug" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>
            {notification.title}
          </p>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {isUnread && (
              <span
                className="w-2.5 h-2.5 rounded-full animate-pulse"
                style={{ background: cfg.color, boxShadow: `0 0 6px ${cfg.color}` }}
              />
            )}
            {!isUnread && (
              <span className="w-2.5 h-2.5 rounded-full bg-slate-200 flex items-center justify-center">
                <Check size={12} className="text-slate-500" />
              </span>
            )}
          </div>
        </div>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>
          {notification.message}
        </p>
        <div className="flex items-center gap-2 mt-2">
          <Clock size={11} className="text-slate-400" />
          <p className="text-[10px] text-slate-400">{time}</p>
        </div>
      </div>
    </button>
  );
};

const Notifications = () => {
  const { notifications, markRead, unreadCount } = useNotifications();
  const hasUnread = unreadCount > 0;

  // Mark all unread as read when the page becomes visible
  useEffect(() => {
    if (!hasUnread) return;
    // Fire individual mark-read mutations (aligned with existing backend route)
    const unread = notifications.filter(n => !n.isRead?.length);
    unread.forEach(n => markRead(n._id));
  }, [hasUnread, notifications, markRead]);

  // Show latest first
  const sortedNotifications = useMemo(() => {
    return [...notifications].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [notifications]);

  return (
    <div className="px-4 py-4 page-enter pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Bell size={18} className="text-slate-600" />
            {hasUnread && (
              <span className="absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full bg-red-500 animate-pulse" />
            )}
          </div>
          <h2 className="text-base font-bold text-slate-800" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>
            নোটিফিকেশন
          </h2>
        </div>
        {notifications.length > 0 && (
          <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
            {notifications.length} টি
          </span>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center text-3xl shadow-inner">🔔</div>
          <p className="text-slate-400 text-sm" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>কোনো নোটিফিকেশন নেই</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sortedNotifications.map(n => (
            <NotificationItem
              key={n._id}
              notification={n}
              onMarkRead={markRead}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;
