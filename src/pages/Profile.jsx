// client/src/pages/Profile.jsx
import { useState, useRef } from 'react';
import { useAuth } from '../providers/AuthProvider';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Camera, Copy, CheckCircle, User as UserIcon, Phone, Droplets, Edit2, LogOut,
  Wallet, Lock, Eye, EyeOff, ShieldCheck, ChevronRight, TrendingUp, Users, Coins,
  Bell, AlertCircle, Info, X, RefreshCw, ArrowUpRight, ArrowDownLeft, Inbox,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useAxios from '../hooks/useAxios';
import useNotifications from '../hooks/useNotifications';
import toast from 'react-hot-toast';
import { BLOOD_GROUPS } from '../utils/constants';
import { auth } from '../utils/firebase';
import { signInWithEmailAndPassword, updatePassword } from 'firebase/auth';
import DepositModal from '../components/DepositModal';
import LoadingScreen from '../components/LoadingScreen';

// ==================== UI PRIMITIVES ====================

const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 ${className}`}>
    {children}
  </div>
);

const StatCard = ({ icon: Icon, label, value, accent = 'blue', loading = false, onClick = null }) => {
  const colors = {
    blue:  { bg: 'bg-blue-50',  fg: 'text-blue-600',  ring: 'ring-blue-100'  },
    green: { bg: 'bg-green-50', fg: 'text-green-600', ring: 'ring-green-100' },
  };
  const c = colors[accent] || colors.blue;
  const Component = onClick ? 'button' : 'div';
  return (
    <Component
      onClick={onClick || undefined}
      className={`bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-left w-full ${onClick ? 'hover:border-gray-200 hover:shadow-md active:scale-[0.98] transition-all cursor-pointer' : ''}`}
    >
      <div className="flex items-start justify-between">
        <div className={`w-9 h-9 rounded-xl ${c.bg} ${c.fg} ring-4 ${c.ring} flex items-center justify-center mb-3`}>
          <Icon size={16} />
        </div>
        {onClick && <ChevronRight size={14} className="text-gray-300 mt-1.5" />}
      </div>
      <p className="text-[11px] text-gray-500 font-medium">{label}</p>
      {loading
        ? <div className="h-6 w-20 mt-1 rounded bg-gray-100 animate-pulse" />
        : <p className="text-lg font-bold text-gray-800 mt-0.5 tracking-tight">{value}</p>}
    </Component>
  );
};

const InfoRow = ({ icon: Icon, label, value, accent = 'gray' }) => {
  const colors = {
    blue:   'bg-blue-50 text-blue-600',
    rose:   'bg-rose-50 text-rose-600',
    purple: 'bg-purple-50 text-purple-600',
    gray:   'bg-gray-50 text-gray-600',
  };
  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-100 last:border-0">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${colors[accent] || colors.gray}`}>
        <Icon size={16} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wide">{label}</p>
        <p className="text-sm font-semibold text-gray-800 truncate mt-0.5">{value || '—'}</p>
      </div>
    </div>
  );
};

const QuickAction = ({ icon: Icon, label, onClick, accent = 'blue', disabled = false }) => {
  const colors = {
    blue:  'bg-blue-50 text-blue-600 hover:bg-blue-100',
    green: 'bg-green-50 text-green-600 hover:bg-green-100',
    amber: 'bg-amber-50 text-amber-600 hover:bg-amber-100',
    red:   'bg-red-50 text-red-600 hover:bg-red-100',
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex flex-col items-center justify-center gap-2 p-3 rounded-2xl border border-gray-100 ${colors[accent] || colors.blue} transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      <Icon size={20} />
      <span className="text-xs font-semibold">{label}</span>
    </button>
  );
};

const PinInput = ({ value, onChange, show, placeholder = '••••••' }) => (
  <input
    type={show ? 'text' : 'password'}
    inputMode="numeric"
    value={value}
    onChange={e => onChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
    placeholder={placeholder}
    maxLength={6}
    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none text-center text-lg font-semibold tracking-[0.5em] transition-all"
  />
);

// Inline alert banner used across the page
const Alert = ({ variant = 'info', icon: Icon, title, message, action, onAction, onClose }) => {
  const variants = {
    success: { bg: 'bg-green-50', border: 'border-green-200', title: 'text-green-800', text: 'text-green-700', iconBg: 'bg-green-100', iconFg: 'text-green-600', btn: 'bg-green-600 hover:bg-green-700' },
    error:   { bg: 'bg-red-50',   border: 'border-red-200',   title: 'text-red-800',   text: 'text-red-700',   iconBg: 'bg-red-100',   iconFg: 'text-red-600',   btn: 'bg-red-600 hover:bg-red-700' },
    warning: { bg: 'bg-amber-50', border: 'border-amber-200', title: 'text-amber-800', text: 'text-amber-700', iconBg: 'bg-amber-100', iconFg: 'text-amber-600', btn: 'bg-amber-600 hover:bg-amber-700' },
    info:    { bg: 'bg-blue-50',  border: 'border-blue-200',  title: 'text-blue-800',  text: 'text-blue-700',  iconBg: 'bg-blue-100',  iconFg: 'text-blue-600',  btn: 'bg-blue-600 hover:bg-blue-700' },
  };
  const v = variants[variant] || variants.info;
  const DefaultIcon = { success: CheckCircle, error: AlertCircle, warning: AlertCircle, info: Info }[variant] || Info;
  const Ico = Icon || DefaultIcon;

  return (
    <div className={`flex items-start gap-3 p-3.5 rounded-2xl border ${v.bg} ${v.border}`}>
      <div className={`w-9 h-9 rounded-xl ${v.iconBg} ${v.iconFg} flex items-center justify-center flex-shrink-0`}>
        <Ico size={16} />
      </div>
      <div className="flex-1 min-w-0">
        {title && <p className={`text-sm font-bold ${v.title} leading-tight`}>{title}</p>}
        {message && <p className={`text-xs ${v.text} mt-0.5 leading-snug`}>{message}</p>}
        {action && (
          <button
            onClick={onAction}
            className={`mt-2 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-white text-xs font-semibold shadow-sm transition-colors ${v.btn}`}
          >
            {action}
          </button>
        )}
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className={`w-7 h-7 rounded-lg ${v.iconFg} hover:bg-white/60 flex items-center justify-center flex-shrink-0 transition-colors`}
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
};

// Bengali month names + helper to format YYYY-MM as month
const BN_MONTHS = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'];

const formatPaymentMonth = (paymentMonth) => {
  if (!paymentMonth) return null;
  const [year, month] = paymentMonth.split('-');
  const idx = parseInt(month, 10) - 1;
  if (Number.isNaN(idx) || idx < 0 || idx > 11) return paymentMonth;
  return { label: BN_MONTHS[idx], year };
};

// Excel-style row used inside the balance bottom sheet table
const HistoryTableRow = ({ tx, index }) => {
  const isDeposit = tx.type === 'deposit';
  const date = (() => {
    try { return new Date(tx.createdAt).toLocaleDateString('bn-BD', { day: '2-digit', month: '2-digit', year: '2-digit' }); }
    catch { return '—'; }
  })();
  const month = formatPaymentMonth(tx.paymentMonth);

  const statusMap = {
    approved: { label: 'অনুমোদিত', short: 'A', bg: 'bg-green-50',  fg: 'text-green-700', dot: 'bg-green-500' },
    pending:  { label: 'অপেক্ষমাণ', short: 'P', bg: 'bg-amber-50',  fg: 'text-amber-700', dot: 'bg-amber-500' },
    rejected: { label: 'বাতিল',     short: 'R', bg: 'bg-red-50',    fg: 'text-red-700',   dot: 'bg-red-500'   },
  };
  const status = statusMap[tx.status] || statusMap.pending;
  const isApproved = tx.status === 'approved';

  return (
    <tr className={`border-b border-gray-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/60'} hover:bg-blue-50/40 transition-colors`}>
      {/* # */}
      <td className="px-1 py-2 text-[10px] text-gray-400 font-mono text-center border-r border-gray-200 align-top">
        {index + 1}
      </td>

      {/* Date + Month stacked */}
      <td className="px-1.5 py-2 border-r border-gray-200 align-top">
        <p className="text-[11px] font-mono text-gray-700 leading-tight">{date}</p>
        {month ? (
          <p className="text-[10px] text-blue-600 font-semibold leading-tight mt-0.5 truncate">
            {month.label.slice(0, 4)} {month.year.slice(-2)}
          </p>
        ) : (
          <p className="text-[10px] text-gray-300 leading-tight mt-0.5">—</p>
        )}
      </td>

      {/* Type (icon only on narrow, label hidden on xs) */}
      <td className="px-1.5 py-2 border-r border-gray-200 align-top">
        <span className={`inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[10px] font-semibold ${
          isDeposit ? 'bg-green-50 text-green-700' : 'bg-rose-50 text-rose-700'
        }`}>
          {isDeposit ? <ArrowDownLeft size={9} /> : <ArrowUpRight size={9} />}
          <span className="hidden xs:inline">{isDeposit ? 'জমা' : 'উত্তোলন'}</span>
        </span>
      </td>

      {/* Amount */}
      <td className={`px-1.5 py-2 text-right text-[11px] font-bold whitespace-nowrap border-r border-gray-200 align-top ${
        !isApproved ? 'text-gray-400' :
        isDeposit ? 'text-green-600' : 'text-rose-600'
      }`}>
        {isApproved ? (isDeposit ? '+' : '-') : ''}৳{Number(tx.amount || 0).toLocaleString()}
      </td>

      {/* Status — dot + truncated label */}
      <td className="px-1.5 py-2 align-top">
        <span className={`inline-flex items-center gap-1 px-1 py-0.5 rounded text-[10px] font-semibold ${status.bg} ${status.fg}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${status.dot} flex-shrink-0`} />
          <span className="truncate max-w-[60px]">{status.label}</span>
        </span>
      </td>
    </tr>
  );
};

// Skeleton card for loading state
const ProfileSkeleton = () => (
  <div className="min-h-screen bg-gray-50 pb-8 animate-pulse">
    <div className="relative bg-blue-700 px-6 pt-8 pb-20">
      <div className="flex flex-col items-center">
        <div className="w-28 h-28 rounded-full bg-blue-500/40 ring-4 ring-white/30" />
        <div className="h-5 w-32 bg-white/30 rounded mt-4" />
        <div className="h-4 w-24 bg-white/20 rounded mt-3" />
      </div>
    </div>
    <div className="px-4 -mt-12 relative space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="h-24 rounded-2xl bg-white border border-gray-100" />
        <div className="h-24 rounded-2xl bg-white border border-gray-100" />
      </div>
      <div className="h-24 rounded-2xl bg-white border border-gray-100" />
      <div className="h-48 rounded-2xl bg-white border border-gray-100" />
    </div>
  </div>
);

// ==================== MAIN COMPONENT ====================

const Profile = () => {
  const { dbUser, logout, isAdmin, setDbUser, loading: authLoading } = useAuth();
  const { unreadCount, notifications } = useNotifications();
  const [copied, setCopied] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({});
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [changePinMode, setChangePinMode] = useState(false);
  const [pinForm, setPinForm] = useState({ previousPin: '', newPin: '', confirmPin: '' });
  const [showPin, setShowPin] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showBalanceHistory, setShowBalanceHistory] = useState(false);
  const [dismissedNotif, setDismissedNotif] = useState(false);

  const navigate = useNavigate();
  const axios = useAxios();
  const avatarRef = useRef(null);

  // ── Queries ────────────────────────────────────────────────────────────
  const balanceQuery = useQuery({
    queryKey: ['total-balance'],
    queryFn: () => axios.get('/member/total-balance').then(r => r.data),
    enabled: !!dbUser,
    retry: 1,
  });

  const statsQuery = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => axios.get('/admin/stats').then(r => r.data),
    enabled: !!dbUser && isAdmin,
    retry: 1,
  });

  const transactionsQuery = useQuery({
    queryKey: ['my-transactions'],
    queryFn: () => axios.get('/member/transactions').then(r => r.data.transactions || []),
    enabled: !!dbUser && showBalanceHistory,
    retry: 1,
  });

  // ── Mutations ──────────────────────────────────────────────────────────
  const updateMutation = useMutation({
    mutationFn: () => {
      const fd = new FormData();
      if (form.name !== undefined) fd.append('name', form.name);
      if (form.phone !== undefined) fd.append('phone', form.phone);
      if (form.bloodGroup !== undefined) fd.append('bloodGroup', form.bloodGroup);
      return axios.patch('/member/profile', fd);
    },
    onSuccess: (res) => {
      setDbUser(res.data.user);
      toast.success('প্রোফাইল আপডেট হয়েছে', { icon: '✅' });
      setEditMode(false);
    },
    onError: (err) => {
      console.error('[Profile] Update failed:', err);
      const message = err?.response?.data?.message || 'আপডেট ব্যর্থ হয়েছে';
      toast.error(message, { icon: '⚠️' });
    },
  });

  const avatarMutation = useMutation({
    mutationFn: (file) => {
      const fd = new FormData();
      fd.append('avatar', file);
      return axios.patch('/member/profile', fd);
    },
    onMutate: () => {
      toast.loading('ছবি আপলোড হচ্ছে...', { id: 'avatar-upload' });
    },
    onSuccess: (res) => {
      setDbUser(res.data.user);
      toast.success('ছবি আপডেট হয়েছে', { id: 'avatar-upload', icon: '📸' });
      setAvatarPreview(null);
    },
    onError: (err) => {
      console.error('[Profile] Avatar upload failed:', err);
      const status = err?.response?.status;
      let message = 'ছবি আপলোড ব্যর্থ';
      if (status === 413) message = 'ছবির আকার অনেক বড়';
      else if (status === 401) message = 'লগইন মেয়াদ শেষ, আবার লগইন করুন';
      else if (err?.message === 'Network Error') message = 'ইন্টারনেট সংযোগ নেই';
      else if (err?.response?.data?.message) message = err.response.data.message;
      toast.error(message, { id: 'avatar-upload', icon: '⚠️' });
      setAvatarPreview(null);
    },
  });

  const pinMutation = useMutation({
    mutationFn: async () => {
      const email = `${getBbrsId()}@khanbari.somity`;
      await signInWithEmailAndPassword(auth, email, pinForm.previousPin);
      await updatePassword(auth.currentUser, pinForm.newPin);
      await axios.post('/member/change-pin', { newPin: pinForm.newPin });
    },
    onSuccess: () => {
      toast.success('পিন পরিবর্তন সফল হয়েছে', { icon: '🔒' });
      setChangePinMode(false);
      setPinForm({ previousPin: '', newPin: '', confirmPin: '' });
    },
    onError: (err) => {
      console.error('[Profile] PIN change failed:', err);
      let message = 'পিন পরিবর্তন ব্যর্থ';
      if (err?.code === 'auth/wrong-password' || err?.code === 'auth/invalid-credential') {
        message = 'পুরাতন পিন ভুল';
      } else if (err?.code === 'auth/too-many-requests') {
        message = 'অনেকবার চেষ্টা করেছেন, একটু পরে চেষ্টা করুন';
      } else if (err?.code === 'auth/network-request-failed' || err?.message === 'Network Error') {
        message = 'ইন্টারনেট সংযোগ নেই';
      } else if (err?.response?.data?.message) {
        message = err.response.data.message;
      }
      toast.error(message, { icon: '⚠️' });
    },
  });

  // ── Helpers ────────────────────────────────────────────────────────────
  function getBbrsId() {
    const email = auth.currentUser?.email;
    if (!email) return '';
    return email.split('@')[0];
  }

  const copyId = async () => {
    const id = getBbrsId();
    if (!id) {
      toast.error('আইডি পাওয়া যায়নি');
      return;
    }
    try {
      await navigator.clipboard.writeText(id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('আইডি কপি হয়েছে', { icon: '📋' });
    } catch {
      toast.error('কপি করা যায়নি');
    }
  };

  const openEdit = () => {
    setForm({
      name: dbUser?.name || '',
      phone: dbUser?.phone || '',
      bloodGroup: dbUser?.bloodGroup || ''
    });
    setEditMode(true);
  };

  const handleAvatarChange = (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;

    if (!f.type.startsWith('image/')) {
      toast.error('শুধু ছবি আপলোড করা যাবে', { icon: '🖼️' });
      return;
    }
    const MAX_SIZE = 2 * 1024 * 1024; // 2 MB
    if (f.size > MAX_SIZE) {
      toast.error('ছবির আকার ২ এমবি-এর কম হতে হবে', { icon: '📏' });
      return;
    }

    setAvatarPreview(URL.createObjectURL(f));
    avatarMutation.mutate(f);
  };

  const handleChangePin = () => {
    if (!pinForm.previousPin || !pinForm.newPin || !pinForm.confirmPin) {
      toast.error('সব ঘর পূরণ করুন');
      return;
    }
    if (pinForm.newPin.length !== 6) {
      toast.error('৬ সংখ্যার পিন দিন');
      return;
    }
    if (pinForm.newPin !== pinForm.confirmPin) {
      toast.error('পিন দুটি মিলছে না');
      return;
    }
    if (pinForm.newPin === pinForm.previousPin) {
      toast.error('নতুন পিন আগের পিনের মতো হতে পারবে না');
      return;
    }
    pinMutation.mutate();
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('[Profile] Logout failed:', err);
      toast.error('লগআউট ব্যর্থ');
    }
  };

  // ── Loading & Error states ─────────────────────────────────────────────
  if (authLoading) return <LoadingScreen message="প্রোফাইল লোড হচ্ছে..." />;
  if (!dbUser) return <ProfileSkeleton />;

  const totalBalance = balanceQuery.data?.totalBalance || 0;
  const myBalance = dbUser?.balance || 0;
  const initial = dbUser?.name?.[0]?.toUpperCase() || '?';
  const latestNotif = notifications?.[0];

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* ══════════════════ HERO HEADER ══════════════════ */}
      <div className="relative overflow-hidden">
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 50%, #2563eb 100%)' }}
        />
        <div
          className="absolute -top-16 -right-16 w-56 h-56 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #fff, transparent)' }}
        />
        <div
          className="absolute -bottom-12 -left-12 w-40 h-40 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #fbbf24, transparent)' }}
        />

        <div className="relative px-6 pt-8 pb-20">
          <div className="flex flex-col items-center text-center">
            {/* Avatar */}
            <div className="relative">
              <div className="w-28 h-28 rounded-full overflow-hidden ring-4 ring-white/30 shadow-2xl bg-gradient-to-br from-blue-300 to-blue-500">
                {(avatarPreview || dbUser?.avatar) ? (
                  <img src={avatarPreview || dbUser.avatar} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-white">
                    {initial}
                  </div>
                )}
                {avatarMutation.isPending && (
                  <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center">
                    <div className="w-7 h-7 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <p className="text-[10px] text-white mt-1.5 font-semibold">আপলোড হচ্ছে...</p>
                  </div>
                )}
              </div>
              <button
                onClick={() => avatarRef.current?.click()}
                disabled={avatarMutation.isPending}
                className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-white text-blue-600 flex items-center justify-center shadow-lg ring-2 ring-white active:scale-90 transition-transform disabled:opacity-50"
                aria-label="ছবি পরিবর্তন করুন"
              >
                <Camera size={15} />
              </button>
              <input
                ref={avatarRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>

            {/* Name & Role */}
            <h1 className="text-xl font-bold text-white mt-4">{dbUser?.name || 'সদস্য'}</h1>
            <div className="flex items-center gap-2 mt-2">
              {isAdmin ? (
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-400/20 text-amber-100 text-[11px] font-semibold border border-amber-300/30">
                  <ShieldCheck size={11} /> অ্যাডমিন
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-full bg-white/15 text-blue-100 text-[11px] font-semibold border border-white/20">
                  সদস্য
                </span>
              )}
              {dbUser?.bloodGroup && (
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/15 text-white text-[11px] font-semibold border border-white/20">
                  🩸 {dbUser.bloodGroup}
                </span>
              )}
            </div>

            {/* ID Pill */}
            <button
              onClick={copyId}
              className="mt-3 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur border border-white/20 active:scale-95 transition-transform"
            >
              <span className="text-xs font-mono text-white tracking-wider">{getBbrsId() || '———'}</span>
              {copied
                ? <CheckCircle size={13} className="text-green-300" />
                : <Copy size={13} className="text-white/70" />}
            </button>
          </div>
        </div>
      </div>

      {/* ══════════════════ CONTENT ══════════════════ */}
      <div className="px-4 -mt-12 relative space-y-4">
        {/* ── Notification Alert ── */}
        {unreadCount > 0 && !dismissedNotif && (
          <Alert
            variant="info"
            icon={Bell}
            title={`${unreadCount} টি নতুন নোটিফিকেশন`}
            message={latestNotif?.title || 'অপঠিত নোটিফিকেশন রয়েছে'}
            action="দেখুন"
            onAction={() => navigate('/notifications')}
            onClose={() => setDismissedNotif(true)}
          />
        )}

        {/* ── Balance cards (with loading & error) ── */}
        {balanceQuery.isError ? (
          <Alert
            variant="error"
            icon={AlertCircle}
            title="ব্যালেন্স লোড করা যায়নি"
            message="ইন্টারনেট সংযোগ পরীক্ষা করুন এবং আবার চেষ্টা করুন"
            action={
              <span className="flex items-center gap-1">
                <RefreshCw size={12} /> আবার চেষ্টা
              </span>
            }
            onAction={() => balanceQuery.refetch()}
          />
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              icon={Wallet}
              label="আমার ব্যালেন্স"
              value={`৳${myBalance.toLocaleString()}`}
              accent="green"
              loading={false}
              onClick={() => setShowBalanceHistory(true)}
            />
            <StatCard
              icon={TrendingUp}
              label="মোট ব্যালেন্স"
              value={`৳${totalBalance.toLocaleString()}`}
              accent="blue"
              loading={balanceQuery.isLoading}
            />
          </div>
        )}

        {/* ── Quick Actions ── */}
        <Card className="p-3">
          <div className="grid grid-cols-3 gap-2.5">
            <QuickAction
              icon={Wallet}
              label="জমা করুন"
              onClick={() => setShowDepositModal(true)}
              accent="green"
            />
            <QuickAction
              icon={Edit2}
              label="এডিট"
              onClick={openEdit}
              accent="blue"
            />
            <QuickAction
              icon={Lock}
              label="পিন পরিবর্তন"
              onClick={() => setChangePinMode(v => !v)}
              accent="amber"
            />
          </div>
        </Card>

        {/* ── Pin Change Panel ── */}
        {changePinMode && (
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-gray-800">পিন পরিবর্তন</h3>
                <p className="text-xs text-gray-500 mt-0.5">নতুন ৬ সংখ্যার পিন সেট করুন</p>
              </div>
              <button
                onClick={() => setShowPin(!showPin)}
                className="w-9 h-9 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 flex items-center justify-center transition-colors"
                aria-label={showPin ? 'পিন লুকান' : 'পিন দেখান'}
              >
                {showPin ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1.5 block">পুরাতন পিন</label>
                <PinInput
                  value={pinForm.previousPin}
                  onChange={v => setPinForm({ ...pinForm, previousPin: v })}
                  show={showPin}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1.5 block">নতুন পিন</label>
                <PinInput
                  value={pinForm.newPin}
                  onChange={v => setPinForm({ ...pinForm, newPin: v })}
                  show={showPin}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1.5 block">নতুন পিন নিশ্চিত করুন</label>
                <PinInput
                  value={pinForm.confirmPin}
                  onChange={v => setPinForm({ ...pinForm, confirmPin: v })}
                  show={showPin}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => { setChangePinMode(false); setPinForm({ previousPin: '', newPin: '', confirmPin: '' }); }}
                  disabled={pinMutation.isPending}
                  className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-colors active:scale-95 disabled:opacity-50"
                >
                  বাতিল
                </button>
                <button
                  onClick={handleChangePin}
                  disabled={pinMutation.isPending}
                  className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-semibold shadow-md shadow-blue-500/20 hover:bg-blue-700 disabled:opacity-50 transition-colors active:scale-95 flex items-center justify-center gap-2"
                >
                  {pinMutation.isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>হচ্ছে...</span>
                    </>
                  ) : (
                    'সেভ করুন'
                  )}
                </button>
              </div>
            </div>
          </Card>
        )}

        {/* ── Personal Information ── */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-gray-800">ব্যক্তিগত তথ্য</h3>
            <button
              onClick={openEdit}
              className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              <Edit2 size={12} /> এডিট
            </button>
          </div>
          <div className="-my-1">
            <InfoRow icon={UserIcon} label="নাম" value={dbUser?.name} accent="blue" />
            <InfoRow icon={Phone} label="ফোন" value={dbUser?.phone} accent="purple" />
            <InfoRow icon={Droplets} label="রক্তের গ্রুপ" value={dbUser?.bloodGroup} accent="rose" />
          </div>
        </Card>

        {/* ── Blood Group Warning ── */}
        {!dbUser?.bloodGroup && !editMode && (
          <Alert
            variant="warning"
            icon={Droplets}
            title="রক্তের গ্রুপ যোগ করুন"
            message="জরুরি প্রয়োজনে কাজে আসবে"
            action="এখনই যোগ করুন"
            onAction={openEdit}
          />
        )}

        {/* ── Admin Stats ── */}
        {isAdmin && (
          <>
            {statsQuery.isError ? (
              <Alert
                variant="error"
                title="অ্যাডমিন তথ্য লোড করা যায়নি"
                message={statsQuery.error?.response?.data?.message || 'একটু পরে আবার চেষ্টা করুন'}
                action={
                  <span className="flex items-center gap-1">
                    <RefreshCw size={12} /> রিফ্রেশ
                  </span>
                }
                onAction={() => statsQuery.refetch()}
              />
            ) : statsQuery.isLoading ? (
              <Card className="p-4 bg-blue-50 border-blue-100">
                <div className="flex items-center gap-2 mb-3">
                  <ShieldCheck size={14} className="text-blue-700" />
                  <h3 className="text-sm font-bold text-blue-800">অ্যাডমিন তথ্য</h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="h-16 bg-white/70 rounded-xl animate-pulse" />
                  <div className="h-16 bg-white/70 rounded-xl animate-pulse" />
                </div>
              </Card>
            ) : statsQuery.data && (
              <Card className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100">
                <div className="flex items-center gap-2 mb-3">
                  <ShieldCheck size={14} className="text-blue-700" />
                  <h3 className="text-sm font-bold text-blue-800">অ্যাডমিন তথ্য</h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/70 rounded-xl p-3 border border-white">
                    <div className="flex items-center gap-1.5 text-blue-600 mb-1">
                      <Users size={12} />
                      <p className="text-[10px] font-semibold uppercase tracking-wide">মোট সদস্য</p>
                    </div>
                    <p className="text-xl font-bold text-blue-900">{statsQuery.data.totalMembers || 0}</p>
                  </div>
                  <div className="bg-white/70 rounded-xl p-3 border border-white">
                    <div className="flex items-center gap-1.5 text-blue-600 mb-1">
                      <Coins size={12} />
                      <p className="text-[10px] font-semibold uppercase tracking-wide">মোট জমা</p>
                    </div>
                    <p className="text-xl font-bold text-blue-900">৳{(statsQuery.data.totalDeposits || 0).toLocaleString()}</p>
                  </div>
                </div>
              </Card>
            )}
          </>
        )}

        {/* ── Logout ── */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-white border border-red-100 text-red-600 font-semibold hover:bg-red-50 transition-colors active:scale-[0.98]"
        >
          <LogOut size={16} />
          <span>লগআউট</span>
        </button>
      </div>

      {/* ══════════════════ EDIT BOTTOM SHEET ══════════════════ */}
      {editMode && (
        <div
          className="fixed inset-0 z-50 pb-15 bg-black/50 flex items-end sm:items-center justify-center"
          onClick={() => !updateMutation.isPending && setEditMode(false)}
        >
          <div
            className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl"
            onClick={e => e.stopPropagation()}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-2 sm:hidden">
              <div className="w-10 h-1 rounded-full bg-gray-300" />
            </div>

            <div className="px-5 pt-4 pb-2 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-800">প্রোফাইল এডিট</h3>
              <button
                onClick={() => setEditMode(false)}
                disabled={updateMutation.isPending}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 disabled:opacity-50"
                aria-label="বন্ধ করুন"
              >
                <X size={16} />
              </button>
            </div>

            <div className="px-5 py-4 space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1.5 block">নাম</label>
                <input
                  value={form.name || ''}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                  placeholder="আপনার নাম"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1.5 block">ফোন নম্বর</label>
                <input
                  value={form.phone || ''}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                  placeholder="০১XXXXXXXXX"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1.5 block">রক্তের গ্রুপ</label>
                <select
                  value={form.bloodGroup || ''}
                  onChange={e => setForm({ ...form, bloodGroup: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                >
                  <option value="">নির্বাচন করুন</option>
                  {BLOOD_GROUPS.map(bg => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="px-5 py-4 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => setEditMode(false)}
                disabled={updateMutation.isPending}
                className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-colors active:scale-95 disabled:opacity-50"
              >
                বাতিল
              </button>
              <button
                onClick={() => updateMutation.mutate()}
                disabled={updateMutation.isPending}
                className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-semibold shadow-md shadow-blue-500/20 hover:bg-blue-700 disabled:opacity-50 transition-colors active:scale-95 flex items-center justify-center gap-2"
              >
                {updateMutation.isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>সেভ হচ্ছে...</span>
                  </>
                ) : (
                  'সেভ করুন'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDepositModal && <DepositModal isOpen={showDepositModal} onClose={() => setShowDepositModal(false)} />}

      {/* ══════════════════ BALANCE HISTORY BOTTOM SHEET ══════════════════ */}
      {showBalanceHistory && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center"
          onClick={() => setShowBalanceHistory(false)}
        >
          <div
            className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl h-[90vh] sm:h-auto sm:max-h-[85vh] flex flex-col overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-2 sm:hidden">
              <div className="w-10 h-1 rounded-full bg-gray-300" />
            </div>

            {/* Header */}
            <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-gray-100">
              <div>
                <h3 className="text-lg font-bold text-gray-800">ব্যালেন্স ইতিহাস</h3>
                <p className="text-xs text-gray-500 mt-0.5">আপনার সকল লেনদেনের রেকর্ড</p>
              </div>
              <button
                onClick={() => setShowBalanceHistory(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500"
                aria-label="বন্ধ করুন"
              >
                <X size={16} />
              </button>
            </div>

            {/* Summary */}
            <div className="px-4 py-3 grid grid-cols-3 gap-2 bg-gradient-to-br from-blue-50 to-indigo-50 border-b border-gray-100">
              <div className="min-w-0">
                <p className="text-[9px] text-gray-500 font-semibold uppercase tracking-wide truncate">বর্তমান</p>
                <p className="text-sm font-bold text-gray-800 mt-0.5 truncate">৳{myBalance.toLocaleString()}</p>
              </div>
              {(() => {
                const txs = transactionsQuery.data || [];
                const approved = txs.filter(t => t.status === 'approved');
                const totalIn = approved.filter(t => t.type === 'deposit').reduce((s, t) => s + (Number(t.amount) || 0), 0);
                const totalOut = approved.filter(t => t.type === 'withdrawal').reduce((s, t) => s + (Number(t.amount) || 0), 0);
                return (
                  <>
                    <div className="min-w-0">
                      <p className="text-[9px] text-gray-500 font-semibold uppercase tracking-wide truncate">মোট জমা</p>
                      <p className="text-sm font-bold text-green-600 mt-0.5 truncate">৳{totalIn.toLocaleString()}</p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] text-gray-500 font-semibold uppercase tracking-wide truncate">উত্তোলন</p>
                      <p className="text-sm font-bold text-rose-600 mt-0.5 truncate">৳{totalOut.toLocaleString()}</p>
                    </div>
                  </>
                );
              })()}
            </div>

            {/* List */}
            <div
              className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-2 pt-3 pb-20 bg-gray-100/40"
              style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}
            >
              {transactionsQuery.isLoading ? (
                <div className="space-y-1.5">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-9 bg-gray-100 rounded animate-pulse" />
                  ))}
                </div>
              ) : transactionsQuery.isError ? (
                <Alert
                  variant="error"
                  title="লেনদেন লোড করা যায়নি"
                  message={transactionsQuery.error?.response?.data?.message || 'ইন্টারনেট সংযোগ পরীক্ষা করুন'}
                  action={
                    <span className="flex items-center gap-1">
                      <RefreshCw size={12} /> আবার চেষ্টা
                    </span>
                  }
                  onAction={() => transactionsQuery.refetch()}
                />
              ) : (transactionsQuery.data?.length || 0) === 0 ? (
                <div className="text-center py-12">
                  <div className="w-14 h-14 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center mx-auto mb-3">
                    <Inbox size={24} />
                  </div>
                  <p className="text-sm font-semibold text-gray-700">কোনো লেনদেন নেই</p>
                  <p className="text-xs text-gray-400 mt-1">এখনো কোনো জমা বা উত্তোলন হয়নি</p>
                </div>
              ) : (
                <div className="rounded-lg overflow-hidden border border-gray-300 shadow-sm bg-white">
                  <table className="w-full border-collapse text-left" style={{ tableLayout: 'fixed' }}>
                    <colgroup>
                      <col style={{ width: '8%' }} />
                      <col style={{ width: '30%' }} />
                      <col style={{ width: '20%' }} />
                      <col style={{ width: '24%' }} />
                      <col style={{ width: '18%' }} />
                    </colgroup>
                    <thead className="bg-gradient-to-b from-gray-100 to-gray-50 sticky top-0 z-10">
                      <tr className="border-b-2 border-gray-300">
                        <th className="px-1 py-2 text-[9px] font-bold text-gray-600 uppercase tracking-wide text-center border-r border-gray-300">#</th>
                        <th className="px-1.5 py-2 text-[9px] font-bold text-gray-600 uppercase tracking-wide border-r border-gray-300">তারিখ / মাস</th>
                        <th className="px-1.5 py-2 text-[9px] font-bold text-gray-600 uppercase tracking-wide border-r border-gray-300">ধরন</th>
                        <th className="px-1.5 py-2 text-[9px] font-bold text-gray-600 uppercase tracking-wide text-right border-r border-gray-300">টাকা</th>
                        <th className="px-1.5 py-2 text-[9px] font-bold text-gray-600 uppercase tracking-wide">স্ট্যাটাস</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactionsQuery.data.map((tx, i) => (
                        <HistoryTableRow key={tx._id} tx={tx} index={i} />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Sticky totals footer */}
            {!transactionsQuery.isLoading && !transactionsQuery.isError && (transactionsQuery.data?.length || 0) > 0 && (
              <div className="px-4 py-3 border-t border-gray-200 bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-between flex-shrink-0">
                <p className="text-[10px] font-bold text-gray-600 uppercase tracking-wide">
                  মোট ({transactionsQuery.data.length} টি)
                </p>
                <p className="text-sm font-bold text-gray-800">
                  ৳{myBalance.toLocaleString()}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
