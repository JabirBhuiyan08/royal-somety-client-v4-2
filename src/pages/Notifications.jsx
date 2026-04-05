// client/src/pages/Notifications.jsx
import useNotifications from '../hooks/useNotifications';
import { Bell, Info, AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const typeConfig = {
  info:    { icon: Info,          color: '#2563eb', bg: '#eff6ff' },
  success: { icon: CheckCircle,   color: '#16a34a', bg: '#f0fdf4' },
  warning: { icon: AlertTriangle, color: '#ea580c', bg: '#fff7ed' },
  alert:   { icon: AlertCircle,   color: '#dc2626', bg: '#fef2f2' },
};

const Notifications = () => {
  const { notifications, markRead } = useNotifications();

  return (
    <div className="px-4 py-4 page-enter pb-24">
      <div className="flex items-center gap-2 mb-5">
        <Bell size={18} className="text-slate-600" />
        <h2 className="text-base font-bold text-slate-800" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>নোটিফিকেশন</h2>
      </div>

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center text-3xl">🔔</div>
          <p className="text-slate-400 text-sm" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>কোনো নোটিফিকেশন নেই</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map(n => {
            const cfg = typeConfig[n.type] || typeConfig.info;
            const Icon = cfg.icon;
            const time = n.createdAt ? formatDistanceToNow(new Date(n.createdAt), { addSuffix: true }) : '';
            const isUnread = !n.isRead?.length;
            return (
              <button key={n._id} onClick={() => markRead(n._id)}
                className="w-full text-left card-sm p-4 flex gap-3 active:bg-slate-50 transition-colors"
                style={isUnread ? { borderLeft: `3px solid ${cfg.color}` } : {}}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: cfg.bg }}>
                  <Icon size={16} style={{ color: cfg.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-bold text-slate-800 leading-snug" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>{n.title}</p>
                    {isUnread && <span className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{ background: cfg.color }} />}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>{n.message}</p>
                  <p className="text-xs text-slate-400 mt-1.5">{time}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Notifications;
