// client/src/components/Navbar.jsx
import { useState, useMemo, useEffect } from 'react';
import { Menu, X, LayoutDashboard, CheckSquare, Users, Bell, Settings, LogOut, MessageCircle, Home, CreditCard, Tag, BarChart3, Image, Send, ExternalLink, ChevronRight, Circle, Globe, Activity } from 'lucide-react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../providers/AuthProvider';
import useNotifications from '../hooks/useNotifications';
import useAxios from '../hooks/useAxios';
import { useQuery } from '@tanstack/react-query';
import LogoImage from '../../assets/Logo.png';

// ─── Color System ───────────────────────────────────────────────────────────

const COLORS = {
  blue:       { fg: 'text-blue-600',     bg: 'bg-blue-50',   ring: 'ring-blue-500/20',   shadow: 'shadow-blue-500/10',  light: 'bg-blue-400/10',  accent: '#3b82f6' },
  indigo:     { fg: 'text-indigo-600',   bg: 'bg-indigo-50', ring: 'ring-indigo-500/20', shadow: 'shadow-indigo-500/10', light: 'bg-indigo-400/10', accent: '#6366f1' },
  green:      { fg: 'text-green-600',    bg: 'bg-green-50',  ring: 'ring-green-500/20',  shadow: 'shadow-green-500/10',  light: 'bg-green-400/10',  accent: '#22c55e' },
  purple:     { fg: 'text-purple-600',   bg: 'bg-purple-50', ring: 'ring-purple-500/20', shadow: 'shadow-purple-500/10', light: 'bg-purple-400/10', accent: '#a855f7' },
  orange:     { fg: 'text-orange-600',   bg: 'bg-orange-50', ring: 'ring-orange-500/20', shadow: 'shadow-orange-500/10', light: 'bg-orange-400/10', accent: '#f97316' },
  gray:       { fg: 'text-gray-600',     bg: 'bg-gray-50',   ring: 'ring-gray-500/20',   shadow: 'shadow-gray-500/10',  light: 'bg-gray-400/10',  accent: '#6b7280' },
  cyan:       { fg: 'text-cyan-600',     bg: 'bg-cyan-50',   ring: 'ring-cyan-500/20',   shadow: 'shadow-cyan-500/10',  light: 'bg-cyan-400/10',  accent: '#06b6d4' },
  rose:       { fg: 'text-rose-600',     bg: 'bg-rose-50',   ring: 'ring-rose-500/20',   shadow: 'shadow-rose-500/10',  light: 'bg-rose-400/10',  accent: '#f43f5e' },
  violet:     { fg: 'text-violet-600',   bg: 'bg-violet-50', ring: 'ring-violet-500/20', shadow: 'shadow-violet-500/10', light: 'bg-violet-400/10', accent: '#7c3aed' },
  emerald:    { fg: 'text-emerald-600',  bg: 'bg-emerald-50',ring: 'ring-emerald-500/20',shadow: 'shadow-emerald-500/10',light:'bg-emerald-400/10',accent:'#10b981' },
  amber:      { fg: 'text-amber-600',    bg: 'bg-amber-50',  ring: 'ring-amber-500/20',  shadow: 'shadow-amber-500/10',  light: 'bg-amber-400/10',  accent: '#f59e0b' },
};

// ─── Config ─────────────────────────────────────────────────────────────────

const ADMIN_MENU = [
  {
    label: 'প্রধান',
    items: [
      { icon: LayoutDashboard,  label: 'ড্যাশবোর্ড',     to: '/admin/dashboard',     color: 'blue',    shortcut: '⌘D' },
      { icon: BarChart3,        label: 'সকল লেনদেন',    to: '/admin/transactions',  color: 'indigo' },
      { icon: CheckSquare,      label: 'পেমেন্ট অনুমোদন', to: '/admin/payments',    color: 'green',  badgeKey: 'payments' },
    ],
  },
  {
    label: 'ব্যবস্থাপনা',
    items: [
      { icon: Users,            label: 'সদস্য ব্যবস্থাপনা', to: '/admin/members',  color: 'purple' },
      { icon: Image,            label: 'গ্যালারি',         to: '/admin/gallery',   color: 'cyan'   },
      { icon: Bell,             label: 'নোটিফিকেশন',        to: '/admin/notifications', color: 'orange', badgeKey: 'notif' },
      { icon: Tag,              label: 'লক্ষ্যমাত্রা',        to: '/admin/targets',   color: 'blue'   },
    ],
  },
  {
    label: 'সেটিংস',
    items: [
      { icon: Settings,         label: 'সিস্টেম সেটিংস',  to: '/admin/settings',  color: 'gray' },
    ],
  },
];

const QUICK_ACTIONS = [
  { icon: Send,    label: 'ক্যাম্পেইন', color: 'violet' },
  { icon: Globe,   label: 'ওয়েব সাইট', color: 'emerald' },
  { icon: Activity, label: 'অ্যানালিটিক্স', color: 'amber' },
];

// ─── Helpers ────────────────────────────────────────────────────────────────

function getColorSystem(name) {
  return COLORS[name] || COLORS.gray;
}

// ─── Sub-components ─────────────────────────────────────────────────────────

const NavSection = ({ title, items, activePath, onClick, pendingCounts }) => {
  return (
    <div className="mb-1">
      {title && (
        <p className="px-4 mb-2 text-[10px] font-semibold tracking-wider text-gray-400 uppercase">
          {title}
        </p>
      )}
      <div className="space-y-0.5">
        {items.map(({ icon: Icon, label, to, color, badgeKey, shortcut }) => {
          const active = activePath === to;
          const cs = getColorSystem(color || 'gray');
          const badge = badgeKey ? pendingCounts[badgeKey] || 0 : 0;

          return (
            <button
              key={to}
              onClick={() => onClick(to)}
              className={`
                group relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                transition-all duration-200 ease-out outline-none
                ${active
                  ? `${cs.bg} ${cs.fg}`
                  : 'hover:bg-white/60 text-gray-600 hover:text-gray-900'
                }
              `}
            >
              {/* Active left-pill indicator */}
              {active && (
                <div
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
                  style={{ background: cs.accent }}
                />
              )}

              {/* Icon bubble */}
              <div
                className={`
                  w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200
                  ${active
                    ? `shadow-md ${cs.shadow} scale-105`
                    : 'bg-white/60 group-hover:bg-white group-hover:scale-105'
                  }
                `}
                style={active ? { background: cs.accent + '15' } : undefined}
              >
                <Icon size={15} strokeWidth={active ? 2.2 : 1.8} />
              </div>

              {/* Label */}
              <span className="flex-1 text-left text-sm font-medium truncate">
                {label}
              </span>

              {/* Badge */}
              {badge > 0 && (
                <span
                  className="flex items-center justify-center min-w-[20px] h-[20px] rounded-full text-white text-[10px] font-bold px-1 animate-pulse"
                  style={{ background: `linear-gradient(135deg, ${cs.accent}, ${cs.accent}cc)` }}
                >
                  {badge > 99 ? '99+' : badge}
                </span>
              )}

              {/* Shortcut hint */}
              {shortcut && !active && (
                <kbd className="hidden sm:inline-block text-[10px] text-gray-300 font-mono px-1.5 py-0.5 rounded bg-white/50 border border-gray-200">
                  {shortcut}
                </kbd>
              )}

              {/* Arrow */}
              <ChevronRight
                size={13}
                className={`transition-transform duration-200 ${
                  active ? `${cs.fg} opacity-100` : 'text-gray-300 opacity-0 group-hover:opacity-100 group-hover:text-gray-400'
                }`}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
};

const QuickActionBtn = ({ icon: Icon, label, color }) => {
  const cs = getColorSystem(color);
  return (
    <button
      onClick={() => {/* placeholder */}}
      className={`
        flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium
        transition-all duration-200 hover:scale-[1.03] active:scale-[0.97]
        ${cs.bg} ${cs.fg} border border-white/40
      `}
    >
      <Icon size={12} />
      <span>{label}</span>
    </button>
  );
};

// ─── Main Component ─────────────────────────────────────────────────────────

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const { isAdmin, logout, dbUser } = useAuth();
  const { unreadCount } = useNotifications();
  const axios = useAxios();
  const navigate = useNavigate();
  const location = useLocation();

  // Navigation shortcut
  const go = (to) => {
    navigate(to);
    setOpen(false);
  };

  // ── Fetch pending counts ───────────────────────────────────────────────────
  const { data: pendingTx } = useQuery({
    queryKey: ['admin-pending-payments'],
    queryFn: () => axios.get('/admin/transactions?status=pending').then(r => r.data.transactions),
    enabled: isAdmin,
    refetchInterval: 30000,
    refetchIntervalInBackground: true,
  });

  const pendingCounts = useMemo(() => ({
    payments: pendingTx?.length || 0,
    notif:    0,   // placeholder for notification badge on menu
  }), [pendingTx]);

  // ── Derived state ─────────────────────────────────────────────────────────
  const activePath = location.pathname;
  const isActive   = (to) => activePath === to || activePath.startsWith(to + '/');

  // ── Close on Escape ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  // ── Prevent body scroll when open ──────────────────────────────────────────
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  // ── Render ────────────────────────────────────────────────────────────────

  // Total alert count for the navbar bell (pending payments + unread notifications)
  const totalAlertCount = (pendingCounts.payments || 0) + unreadCount;

  return (
    <>
      {/* ══════════════════ TOP BAR ══════════════════ */}
      <header
        className="sticky top-0 z-40"
        style={{
          background: 'rgba(255,255,255,0.82)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(0,0,0,0.06)',
        }}
      >
        <div className="flex items-center justify-between px-4 py-3 max-w-[480px] mx-auto">

          {/* ── Left: Chat + Notification ── */}
          <div className="flex items-center gap-2">
            <Link
              to="/chat"
              className="relative w-10 h-10 rounded-xl flex items-center justify-center
                         bg-gray-50/80 border border-gray-200/60
                         hover:bg-blue-50 hover:border-blue-200/60 active:scale-95
                         transition-all duration-200"
            >
              <MessageCircle size={18} className="text-gray-600 group-hover:text-blue-600" />
              {/* Green online-dot */}
              <Circle size={7} fill="#22c55e" className="absolute -bottom-0.5 -right-0.5 text-transparent" />
            </Link>

            <Link
              to="/notifications"
              className="relative w-10 h-10 rounded-xl flex items-center justify-center
                         bg-gray-50/80 border border-gray-200/60
                         hover:bg-amber-50 hover:border-amber-200/60 active:scale-95
                         transition-all duration-200"
            >
              <Bell size={18} className={`transition-colors ${unreadCount > 0 ? 'text-amber-500' : 'text-gray-600'}`} />
              {unreadCount > 0 && (
                <span
                  className="absolute -top-1.5 -right-1.5
                               min-w-[18px] h-[18px] rounded-full
                               bg-gradient-to-br from-red-500 to-red-600
                               text-white text-[9px] font-bold flex items-center justify-center
                               shadow-lg shadow-red-500/30"
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>
          </div>

          {/* ── Center: Logo ── */}
          <Link to="/" className="flex items-center gap-2 no-underline">
            <img
              src={LogoImage}
              alt="Khanbari"
              className="w-8 h-8 object-contain drop-shadow-sm"
            />
            <div className="text-center leading-tight">
              <h1 className="text-sm font-bold text-gray-800 tracking-tight">
                ভাই ভাই
              </h1>
              <p className="text-[9px] text-gray-400 mt-0.5">
                রয়্যাল সমিতি <span className="opacity-60">· by Jabnox.com</span>
              </p>
            </div>
          </Link>

          {/* ── Right: Admin Menu Toggle ── */}
          {isAdmin && (
            <button
              onClick={() => setOpen(true)}
              className="relative w-10 h-10 rounded-xl flex items-center justify-center
                         bg-gradient-to-br from-blue-500 to-blue-600
                         text-white shadow-md shadow-blue-500/20
                         hover:shadow-lg hover:shadow-blue-500/30 active:scale-95
                         transition-all duration-200"
            >
              <Menu size={18} />
              {totalAlertCount > 0 && (
                <span
                  className="absolute -top-1.5 -right-1.5
                               min-w-[18px] h-[18px] rounded-full
                               bg-gradient-to-br from-amber-400 to-red-500
                               text-white text-[9px] font-bold flex items-center justify-center
                               shadow-lg animate-pulse"
                >
                  {totalAlertCount > 9 ? '9+' : totalAlertCount}
                </span>
              )}
            </button>
          )}
        </div>
      </header>

      {/* ══════════════════ SIDEBAR ══════════════════ */}
      {/* backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px] transition-opacity"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 z-50 h-full w-72
          bg-white/95 backdrop-blur-2xl border-r border-gray-200/60
          shadow-2xl shadow-black/8
          flex flex-col
          transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
          ${open ? 'translate-x-0' : '-translate-x-full'}
        `}
      >

        {/* ── Sidebar Header ── */}
        <div
          className="relative px-5 py-6 overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 50%, #2563eb 100%)',
          }}
        >
          {/* Decorative circles */}
          <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-10"
               style={{ background: 'radial-gradient(circle, #fff, transparent)' }} />
          <div className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full opacity-10"
               style={{ background: 'radial-gradient(circle, #e2b96f, transparent)' }} />

          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold tracking-[0.2em] text-blue-200 uppercase">
                অ্যাডমিন প্যানেল
              </p>
              <h2 className="text-lg font-bold text-white mt-1 leading-tight">
                {dbUser?.name || 'অ্যাডমিন'}
              </h2>
              <div className="flex items-center gap-2 mt-2">
                {dbUser?.bloodGroup && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-md
                                   bg-white/15 text-white text-[10px] font-semibold
                                   border border-white/20 backdrop-blur-sm">
                    🩸 {dbUser.bloodGroup}
                  </span>
                )}
                {isAdmin && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-md
                                   bg-amber-400/20 text-amber-200 text-[10px] font-semibold
                                   border border-amber-400/30 backdrop-blur-sm">
                    <Activity size={9} /> অ্যাডমিন
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={() => setOpen(false)}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20
                         flex items-center justify-center transition-all active:scale-90
                         border border-white/10"
            >
              <X size={15} className="text-white/80" />
            </button>
          </div>
        </div>

        {/* ── Pending Alert Banner ── */}
        {pendingCounts.payments > 0 && (
          <div className="mx-3 -mt-1 mb-3">
            <button
              onClick={() => { go('/admin/payments'); setOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl
                         bg-gradient-to-r from-amber-400 to-orange-500
                         text-white shadow-lg shadow-amber-500/20
                         hover:shadow-xl hover:shadow-amber-500/30 active:scale-[0.98]
                         transition-all duration-200"
            >
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                <Bell size={16} />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-bold leading-tight">
                  {pendingCounts.payments} টি পেমেন্ট অপেক্ষমান
                </p>
                <p className="text-[11px] text-white/80 mt-0.5">
                  অনুমোদনের জন্য ক্লিক করুন
                </p>
              </div>
              <ChevronRight size={16} className="text-white/80" />
            </button>
          </div>
        )}

        {/* ── Scrollable Nav ── */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-3">
          {ADMIN_MENU.map((section) => (
            <NavSection
              key={section.label}
              title={section.label}
              items={section.items}
              activePath={activePath}
              onClick={(to) => { go(to); setOpen(false); }}
              pendingCounts={pendingCounts}
            />
          ))}
        </nav>

        {/* ── Footer / User Card ── */}
        <div className="p-3 border-t border-gray-100/80 bg-gray-50/40">
          {/* Quick Actions */}
          <div className="flex items-center gap-1.5 mb-3 px-1">
            {QUICK_ACTIONS.map(({ icon: Icon, label, color }) => {
              const cs = getColorSystem(color);
              return (
                <button
                  key={label}
                  onClick={() => {/* placeholder */}}
                  title={label}
                  className={`
                    flex items-center justify-center w-8 h-8 rounded-lg
                    transition-all duration-200 active:scale-90
                    ${cs.bg} ${cs.fg} hover:scale-110
                  `}
                >
                  <Icon size={13} />
                </button>
              );
            })}
            <div className="flex-1" />
            <a
              href="https://khanbari.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              title="ওয়েব অ্যাপ খুলুন"
              className="flex items-center justify-center w-8 h-8 rounded-lg
                         bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-blue-600
                         transition-all duration-200 active:scale-90"
            >
              <ExternalLink size={13} />
            </a>
          </div>

          {/* User card + Logout */}
          <button
            onClick={async () => {
              setOpen(false);
              await logout();
              navigate('/login');
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                       bg-red-50/60 hover:bg-red-100/60 border border-transparent
                       hover:border-red-200/60 transition-all duration-200 group"
          >
            <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0
                            bg-gradient-to-br from-red-400 to-red-600 ring-2 ring-white/80
                            group-hover:shadow-md group-hover:shadow-red-500/20 transition-all">
              {dbUser?.avatar ? (
                <img src={dbUser.avatar} alt="" className="w-full h-full rounded-full object-cover" />
              ) : (
                <span className="text-xs font-bold text-white">
                  {dbUser?.name?.[0]?.toUpperCase() || '?'}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-xs font-semibold text-gray-700 truncate group-hover:text-red-700 transition-colors">
                লগআউট করুন
              </p>
              <p className="text-[10px] text-gray-400 truncate">
                {dbUser?.name || 'অ্যাডমিন'}
              </p>
            </div>
            <LogOut size={15} className="text-red-400 group-hover:text-red-600 transition-colors" />
          </button>
        </div>

      </aside>
    </>
  );
};

export default Navbar;
