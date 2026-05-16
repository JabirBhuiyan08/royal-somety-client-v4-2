// client/src/pages/AdminPayments.jsx
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import useAxios from '../hooks/useAxios';
import { 
  CheckCircle, XCircle, Clock, Plus, Filter, Target, User, 
  Calendar, DollarSign, FileText, AlertCircle, Search, 
  Loader2, RefreshCw, Eye, Download, ChevronLeft, ChevronRight,
  Wallet, TrendingUp, Banknote, Receipt
} from 'lucide-react';
import toast from 'react-hot-toast';
import { normalizeMemberId } from '../utils/constants';

// ==================== CONSTANTS ====================

const BN_MONTHS = [
  'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
  'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
];

const STATUS_CONFIG = {
  approved: { 
    bg: 'bg-green-50', 
    text: 'text-green-700', 
    border: 'border-green-200',
    icon: CheckCircle, 
    label: 'অনুমোদিত',
    badge: 'success'
  },
  pending: { 
    bg: 'bg-amber-50', 
    text: 'text-amber-700', 
    border: 'border-amber-200',
    icon: Clock, 
    label: 'অপেক্ষমাণ',
    badge: 'warning'
  },
  rejected: { 
    bg: 'bg-red-50', 
    text: 'text-red-700', 
    border: 'border-red-200',
    icon: XCircle, 
    label: 'বাতিল',
    badge: 'error'
  },
};

const QUICK_AMOUNTS = [500, 1000, 2000, 5000, 10000];

// ==================== COMPONENTS ====================

const LoadingSpinner = () => (
  <div className="flex justify-center py-16">
    <Loader2 size={32} className="animate-spin text-blue-500" />
  </div>
);

const EmptyState = ({ icon: Icon, title, message }) => (
  <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
    <Icon size={48} className="mx-auto text-slate-300 mb-3" />
    <p className="text-slate-600 font-medium mb-1">{title}</p>
    <p className="text-sm text-slate-400">{message}</p>
  </div>
);

const StatsCard = ({ title, value, icon: Icon, color, bg, trend }) => (
  <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
    <div className="flex items-center justify-between mb-2">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: bg }}>
        <Icon size={20} style={{ color }} />
      </div>
      {trend !== undefined && (
        <span className={`text-xs font-medium ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {trend >= 0 ? '+' : ''}{trend}%
        </span>
      )}
    </div>
    <p className="text-2xl font-bold text-slate-800">{value}</p>
    <p className="text-xs text-slate-500 mt-1">{title}</p>
  </div>
);

const StatusBadge = ({ status }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const Icon = config.icon;
  
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${config.bg} ${config.text} border ${config.border}`}>
      <Icon size={12} />
      <span>{config.label}</span>
    </span>
  );
};

const AdminUploadModal = ({ members, onClose, axios, queryClient }) => {
  const [form, setForm] = useState({ 
    memberId: '', 
    amount: '', 
    year: '', 
    month: '', 
    note: '', 
    target: '' 
  });
  const [selectedAmountIndex, setSelectedAmountIndex] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const now = new Date();
  const currentYear = now.getFullYear();
  const yearOptions = Array.from({ length: 11 }, (_, i) => currentYear - i);

  const { data: targets = [] } = useQuery({
    queryKey: ['admin-targets'],
    queryFn: () => axios.get('/member/targets').then(r => r.data.targets),
  });

  const filteredMembers = useMemo(() => {
    if (!searchQuery) return members;
    const query = searchQuery.toLowerCase();
    return members.filter(member =>
      member.name?.toLowerCase().includes(query) ||
      member.memberId?.toLowerCase().includes(query) ||
      member.email?.toLowerCase().includes(query) ||
      member.phone?.includes(query)
    );
  }, [members, searchQuery]);

  const getMonthOptions = () => {
    const year = form.year ? parseInt(form.year) : currentYear;
    return Array.from({ length: 12 }, (_, i) => {
      const monthDate = new Date(year, i, 1);
      const isFuture = monthDate > now;
      return {
        value: String(i + 1).padStart(2, '0'),
        label: BN_MONTHS[i],
        disabled: isFuture
      };
    });
  };

  const mutation = useMutation({
    mutationFn: () => {
      const paymentMonth = `${form.year}-${form.month}`;
      return axios.post('/admin/transactions/admin-upload', {
        memberId: form.memberId,
        amount: parseInt(form.amount) || 0,
        paymentMonth,
        note: form.note || '',
        target: form.target || ''
      });
    },
    onSuccess: () => {
      toast.success('পেমেন্ট সফলভাবে যোগ হয়েছে');
      queryClient.invalidateQueries({ queryKey: ['admin-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      onClose();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'পেমেন্ট যোগ করতে ব্যর্থ');
    },
  });

  const handleSubmit = () => {
    if (!form.memberId) {
      toast.error('সদস্য নির্বাচন করুন');
      return;
    }
    if (!form.year) {
      toast.error('সাল নির্বাচন করুন');
      return;
    }
    if (!form.month) {
      toast.error('মাস নির্বাচন করুন');
      return;
    }
    if (!form.amount || parseInt(form.amount) <= 0) {
      toast.error('বৈধ পরিমাণ লিখুন');
      return;
    }
    mutation.mutate();
  };

  const selectedMember = members.find(m => m._id === form.memberId);

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-800">সদস্যের পক্ষে পেমেন্ট যোগ করুন</h3>
          <p className="text-sm text-slate-500 mt-1">ম্যানুয়ালি পেমেন্ট এন্ট্রি করুন</p>
        </div>

        <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Member Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              সদস্য নির্বাচন করুন *
            </label>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="নাম, আইডি বা ফোন দিয়ে খুঁজুন"
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none text-sm"
              />
            </div>
            <select
              value={form.memberId}
              onChange={e => setForm({...form, memberId: e.target.value})}
              className="w-full mt-2 px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none text-sm bg-white"
            >
              <option value="">সদস্য বেছে নিন</option>
              {filteredMembers.map(m => (
                <option key={m._id} value={m._id}>
                  {m.name} — {normalizeMemberId(m.memberId)}
                </option>
              ))}
            </select>
            {selectedMember && (
              <div className="mt-2 p-2 rounded-lg bg-blue-50 text-xs text-blue-700">
                নির্বাচিত: {selectedMember.name} | ব্যালেন্স: ৳{(selectedMember.balance || 0).toLocaleString()}
              </div>
            )}
          </div>

          {/* Year & Month */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">সাল *</label>
              <select
                value={form.year}
                onChange={e => setForm({...form, year: e.target.value, month: ''})}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none text-sm bg-white"
              >
                <option value="">সাল নির্বাচন</option>
                {yearOptions.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">মাস *</label>
              <select
                value={form.month}
                onChange={e => setForm({...form, month: e.target.value})}
                disabled={!form.year}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none text-sm bg-white disabled:opacity-50"
              >
                <option value="">মাস নির্বাচন</option>
                {getMonthOptions().map(opt => (
                  <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                    {opt.label} {opt.disabled ? '(ভবিষ্যত)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">পরিমাণ (৳) *</label>
            <div className="grid grid-cols-5 gap-2 mb-3">
              {QUICK_AMOUNTS.map((amt, idx) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => {
                    setForm({...form, amount: String(amt)});
                    setSelectedAmountIndex(idx);
                  }}
                  className={`py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedAmountIndex === idx
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  ৳{amt}
                </button>
              ))}
            </div>
            <input
              type="number"
              value={form.amount}
              onChange={e => {
                setForm({...form, amount: e.target.value});
                setSelectedAmountIndex(null);
              }}
              placeholder="অথবা নিজে লিখুন"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none text-sm"
            />
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">নোট (ঐচ্ছিক)</label>
            <textarea
              value={form.note}
              onChange={e => setForm({...form, note: e.target.value})}
              placeholder="যেমন: মাসিক চাঁদা, দান ইত্যাদি"
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none text-sm resize-none"
            />
          </div>

          {/* Target */}
          {targets.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">লক্ষ্য (ঐচ্ছিক)</label>
              <select
                value={form.target}
                onChange={e => setForm({...form, target: e.target.value})}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none text-sm bg-white"
              >
                <option value="">কোনো লক্ষ্য নেই</option>
                {targets.map(t => (
                  <option key={t._id} value={t._id}>
                    {t.title} — ৳{t.goal?.toLocaleString()} (সংগৃহীত: ৳{t.collected?.toLocaleString()})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="p-5 border-t border-slate-100 flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition">
            বাতিল
          </button>
          <button 
            onClick={handleSubmit} 
            disabled={mutation.isPending}
            className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 transition-all"
          >
            {mutation.isPending ? (
              <Loader2 size={16} className="animate-spin mx-auto" />
            ) : (
              'পেমেন্ট যোগ করুন'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

const TransactionRow = ({ transaction, onApprove, onReject, isApproving, isRejecting }) => {
  const date = new Date(transaction.createdAt);
  const formattedDate = date.toLocaleDateString('bn-BD', { day: 'numeric', month: 'short', year: 'numeric' });
  
  return (
    <tr className="hover:bg-slate-50 transition-colors group">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {transaction.user?.avatar ? (
              <img src={transaction.user.avatar} className="w-full h-full object-cover" alt="" />
            ) : (
              <span className="text-sm font-bold text-blue-600">
                {transaction.user?.name?.[0]?.toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">{transaction.user?.name}</p>
            <p className="text-xs text-slate-400 font-mono">{normalizeMemberId(transaction.user?.memberId)}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        {transaction.paymentMonth && (
          <div className="flex flex-col">
            <span className="text-sm font-medium text-slate-700">
              {BN_MONTHS[parseInt(transaction.paymentMonth.split('-')[1]) - 1]}
            </span>
            <span className="text-xs text-slate-400">{transaction.paymentMonth.split('-')[0]}</span>
          </div>
        )}
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex flex-col items-end">
          <span className="text-base font-bold text-green-600">৳{transaction.amount?.toLocaleString()}</span>
          {transaction.note && (
            <span className="text-xs text-slate-400 truncate max-w-[150px]">{transaction.note}</span>
          )}
        </div>
      </td>
      <td className="px-4 py-3 text-center">
        <StatusBadge status={transaction.status} />
        {transaction.uploadedByAdmin && (
          <span className="block text-[10px] text-slate-400 mt-1">অ্যাডমিন দ্বারা যোগ</span>
        )}
      </td>
      <td className="px-4 py-3 text-center">
        <div className="flex items-center justify-center gap-2">
          {transaction.status === 'pending' && (
            <>
              <button
                onClick={() => onApprove(transaction._id)}
                disabled={isApproving}
                className="p-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-all disabled:opacity-50"
                title="অনুমোদন করুন"
              >
                {isApproving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
              </button>
              <button
                onClick={() => onReject(transaction._id)}
                disabled={isRejecting}
                className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-all disabled:opacity-50"
                title="বাতিল করুন"
              >
                {isRejecting ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
              </button>
            </>
          )}
          {transaction.status !== 'pending' && (
            <div className="w-14" />
          )}
        </div>
      </td>
      <td className="px-4 py-3 text-right">
        <span className="text-xs text-slate-400">{formattedDate}</span>
      </td>
    </tr>
  );
};

// ==================== MAIN COMPONENT ====================

const AdminPayments = () => {
  const axios = useAxios();
  const queryClient = useQueryClient();
  
  const [filter, setFilter] = useState('all');
  const [showUpload, setShowUpload] = useState(false);
  const [approvingId, setApprovingId] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Queries
  const { data: transactions = [], isLoading, refetch } = useQuery({
    queryKey: ['admin-transactions', filter],
    queryFn: () => {
      const url = filter === 'all' 
        ? '/admin/transactions' 
        : `/admin/transactions?status=${filter}`;
      return axios.get(url).then(r => r.data.transactions);
    },
  });

  const { data: members = [] } = useQuery({
    queryKey: ['admin-members'],
    queryFn: () => axios.get('/admin/members').then(r => r.data.members),
  });

  const { data: stats } = useQuery({
    queryKey: ['admin-payment-stats'],
    queryFn: () => axios.get('/admin/stats').then(r => r.data),
  });

  // Mutations
  const approveMutation = useMutation({
    mutationFn: (id) => axios.patch(`/admin/transactions/${id}/approve`),
    onSuccess: () => {
      toast.success('পেমেন্ট অনুমোদিত হয়েছে');
      queryClient.invalidateQueries({ queryKey: ['admin-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      setApprovingId(null);
    },
    onError: () => {
      toast.error('অনুমোদন ব্যর্থ হয়েছে');
      setApprovingId(null);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (id) => axios.patch(`/admin/transactions/${id}/reject`),
    onSuccess: () => {
      toast.success('পেমেন্ট বাতিল করা হয়েছে');
      queryClient.invalidateQueries({ queryKey: ['admin-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      setRejectingId(null);
    },
    onError: () => {
      toast.error('বাতিল করতে ব্যর্থ হয়েছে');
      setRejectingId(null);
    },
  });

  // Filtered transactions based on search
  const filteredTransactions = useMemo(() => {
    if (!searchTerm) return transactions;
    const term = searchTerm.toLowerCase();
    return transactions.filter(tx =>
      tx.user?.name?.toLowerCase().includes(term) ||
      tx.user?.memberId?.toLowerCase().includes(term) ||
      tx.user?.phone?.includes(term) ||
      tx.note?.toLowerCase().includes(term)
    );
  }, [transactions, searchTerm]);

  // Stats for display
  const pendingCount = transactions.filter(t => t.status === 'pending').length;
  const approvedCount = transactions.filter(t => t.status === 'approved').length;
  const rejectedCount = transactions.filter(t => t.status === 'rejected').length;
  const totalAmount = transactions
    .filter(t => t.status === 'approved')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const tabs = [
    { key: 'all', label: 'সব', count: transactions.length, color: 'blue' },
    { key: 'pending', label: 'অপেক্ষমাণ', count: pendingCount, color: 'amber' },
    { key: 'approved', label: 'অনুমোদিত', count: approvedCount, color: 'green' },
    { key: 'rejected', label: 'বাতিল', count: rejectedCount, color: 'red' },
  ];

  const handleApprove = (id) => {
    if (window.confirm('এই পেমেন্টটি অনুমোদন করতে চান?')) {
      setApprovingId(id);
      approveMutation.mutate(id);
    }
  };

  const handleReject = (id) => {
    if (window.confirm('এই পেমেন্টটি বাতিল করতে চান?')) {
      setRejectingId(id);
      rejectMutation.mutate(id);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-8">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <Receipt size={24} className="text-blue-600" />
              <h1 className="text-2xl font-bold text-slate-800">পেমেন্ট অনুমোদন</h1>
            </div>
            <p className="text-slate-500 mt-1">সদস্যদের পেমেন্ট অনুমোদন ও পরিচালনা করুন</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => refetch()}
              className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 transition"
            >
              <RefreshCw size={18} className="text-slate-500" />
            </button>
            <button
              onClick={() => setShowUpload(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium hover:from-blue-700 hover:to-blue-800 transition-all shadow-sm"
            >
              <Plus size={16} />
              <span>ম্যানুয়াল পেমেন্ট</span>
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatsCard
            title="মোট লেনদেন"
            value={transactions.length}
            icon={Wallet}
            color="#2563eb"
            bg="#eff6ff"
          />
          <StatsCard
            title="অপেক্ষমাণ"
            value={pendingCount}
            icon={Clock}
            color="#ea580c"
            bg="#fff7ed"
          />
          <StatsCard
            title="অনুমোদিত"
            value={approvedCount}
            icon={CheckCircle}
            color="#16a34a"
            bg="#f0fdf4"
          />
          <StatsCard
            title="মোট অনুমোদিত পরিমাণ"
            value={`৳${totalAmount.toLocaleString()}`}
            icon={Banknote}
            color="#7c3aed"
            bg="#f5f3ff"
          />
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === tab.key
                  ? `bg-${tab.color}-500 text-white shadow-md`
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {tab.label}
              <span className={`px-1.5 py-0.5 rounded-full text-xs ${
                filter === tab.key ? 'bg-white/20' : 'bg-slate-100 text-slate-600'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="mb-4">
          <div className="relative max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="সদস্যের নাম, আইডি বা নোট দিয়ে খুঁজুন..."
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none text-sm bg-white"
            />
          </div>
        </div>

        {/* Transactions Table */}
        {isLoading ? (
          <LoadingSpinner />
        ) : filteredTransactions.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="কোনো লেনদেন নেই"
            message={searchTerm ? "আপনার অনুসন্ধানে কিছু পাওয়া যায়নি" : "এখনও কোনো পেমেন্ট রেকর্ড নেই"}
          />
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">সদস্য</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">মাস</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">পরিমাণ</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">অবস্থা</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">কার্য</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">তারিখ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTransactions.map(transaction => (
                    <TransactionRow
                      key={transaction._id}
                      transaction={transaction}
                      onApprove={handleApprove}
                      onReject={handleReject}
                      isApproving={approvingId === transaction._id}
                      isRejecting={rejectingId === transaction._id}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <AdminUploadModal
          members={members}
          onClose={() => setShowUpload(false)}
          axios={axios}
          queryClient={queryClient}
        />
      )}
    </div>
  );
};

export default AdminPayments;