// client/src/pages/AdminPayments.jsx
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import useAxios from '../hooks/useAxios';
import { 
  CheckCircle, XCircle, Clock, Plus, Filter, Target, User, 
  Calendar, DollarSign, FileText, AlertCircle, Search, 
  Loader2, RefreshCw, Eye, Download, ChevronLeft, ChevronRight,
  Wallet, TrendingUp, Banknote, Receipt, Bell
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
    selectedMonths: [], 
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

  // Fetch existing payments for the selected member to prevent duplicate month payments
  const { data: allTransactions = [] } = useQuery({
    queryKey: ['all-transactions-for-duplicate-check'],
    queryFn: () => axios.get('/admin/transactions?limit=10000').then(r => r.data.transactions || []),
  });

  // Get paid months for the selected member + year (only approved or pending payments count)
  const paidMonths = useMemo(() => {
    if (!form.memberId || !form.year || !allTransactions.length) return new Set();
    return new Set(
      allTransactions
        .filter(tx => {
          const txUserId = typeof tx.user === 'object' ? tx.user?._id : tx.user;
          return (
            txUserId === form.memberId &&
            tx.paymentMonth && 
            tx.paymentMonth.startsWith(form.year) && 
            (tx.status === 'approved' || tx.status === 'pending')
          );
        })
        .map(tx => tx.paymentMonth.split('-')[1])
    );
  }, [allTransactions, form.memberId, form.year]);

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
      const monthValue = String(i + 1).padStart(2, '0');
      const alreadyPaid = paidMonths.has(monthValue);
      return {
        value: monthValue,
        label: BN_MONTHS[i],
        disabled: isFuture || alreadyPaid,
        alreadyPaid
      };
    });
  };

  const toggleMonth = (monthValue) => {
    setForm(prev => {
      const selected = prev.selectedMonths.includes(monthValue)
        ? prev.selectedMonths.filter(m => m !== monthValue)
        : [...prev.selectedMonths, monthValue];
      return { ...prev, selectedMonths: selected };
    });
  };

  const selectAllAvailable = () => {
    const available = getMonthOptions().filter(opt => !opt.disabled).map(opt => opt.value);
    setForm(prev => ({ ...prev, selectedMonths: available }));
  };

  const clearSelection = () => {
    setForm(prev => ({ ...prev, selectedMonths: [] }));
  };

  const mutation = useMutation({
    mutationFn: async () => {
      // Submit payments one by one sequentially to avoid server conflicts
      for (const month of form.selectedMonths) {
        const paymentMonth = `${form.year}-${month}`;
        await axios.post('/admin/transactions/admin-upload', {
          memberId: form.memberId,
          amount: parseInt(form.amount) || 0,
          paymentMonth,
          note: form.note || '',
          target: form.target || ''
        });
      }
    },
    onSuccess: () => {
      toast.success(`${form.selectedMonths.length} মাসের পেমেন্ট সফলভাবে যোগ হয়েছে`);
      queryClient.invalidateQueries({ queryKey: ['admin-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin-payment-stats'] });
      queryClient.invalidateQueries({ queryKey: ['all-transactions-for-duplicate-check'] });
      queryClient.invalidateQueries({ queryKey: ['admin-members'] });
      queryClient.invalidateQueries({ queryKey: ['total-balance'] });
      onClose();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'পেমেন্ট যোগ করতে ব্যর্থ');
      // Refresh data even on partial failure
      queryClient.invalidateQueries({ queryKey: ['admin-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['all-transactions-for-duplicate-check'] });
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
    if (form.selectedMonths.length === 0) {
      toast.error('অন্তত একটি মাস নির্বাচন করুন');
      return;
    }
    if (!form.amount || parseInt(form.amount) <= 0) {
      toast.error('বৈধ পরিমাণ লিখুন');
      return;
    }
    // Double-check: prevent duplicate payment
    const duplicates = form.selectedMonths.filter(m => paidMonths.has(m));
    if (duplicates.length > 0) {
      toast.error('কিছু মাসে ইতিমধ্যে পেমেন্ট করা হয়েছে!');
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
              onChange={e => setForm({...form, memberId: e.target.value, selectedMonths: []})}
              className="w-full mt-2 px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none text-sm bg-white"
            >
              <option value="">সদস্য বেছে নিন</option>
              {filteredMembers.map(m => (
                <option key={m._id} value={m._id}>
                  {m.name} — {(m.email || '').replace(/\D/g, '') || m.phone || ''}
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
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">সাল *</label>
            <select
              value={form.year}
              onChange={e => setForm({...form, year: e.target.value, selectedMonths: []})}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none text-sm bg-white"
            >
              <option value="">সাল নির্বাচন</option>
              {yearOptions.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          {/* Month Multi-Select Grid */}
          {form.year && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-slate-700">মাস নির্বাচন করুন *</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={selectAllAvailable}
                    className="text-xs text-blue-600 font-medium hover:text-blue-700"
                  >
                    সব নির্বাচন
                  </button>
                  {form.selectedMonths.length > 0 && (
                    <button
                      type="button"
                      onClick={clearSelection}
                      className="text-xs text-red-500 font-medium hover:text-red-600"
                    >
                      বাতিল
                    </button>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {getMonthOptions().map(opt => {
                  const isSelected = form.selectedMonths.includes(opt.value);
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      disabled={opt.disabled}
                      onClick={() => toggleMonth(opt.value)}
                      className={`px-2 py-2 rounded-lg text-xs font-medium transition-all border ${
                        opt.alreadyPaid
                          ? 'bg-green-50 border-green-200 text-green-600 cursor-not-allowed opacity-70'
                          : opt.disabled
                          ? 'bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed'
                          : isSelected
                          ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-blue-300 hover:bg-blue-50'
                      }`}
                    >
                      {opt.label}
                      {opt.alreadyPaid && ' ✅'}
                    </button>
                  );
                })}
              </div>
              {form.selectedMonths.length > 0 && (
                <p className="text-xs text-blue-600 mt-2 font-medium">
                  {form.selectedMonths.length} টি মাস নির্বাচিত
                </p>
              )}
              {form.memberId && paidMonths.size > 0 && (
                <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                  <AlertCircle size={12} />
                  {paidMonths.size} টি মাসে ইতিমধ্যে পেমেন্ট করা হয়েছে
                </p>
              )}
            </div>
          )}

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
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={16} className="animate-spin" />
                <span>আপলোড হচ্ছে...</span>
              </span>
            ) : (
              form.selectedMonths.length > 1 
                ? `${form.selectedMonths.length} মাসের পেমেন্ট যোগ করুন`
                : 'পেমেন্ট যোগ করুন'
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
            <p className="text-xs text-slate-400 font-mono">{(transaction.user?.email || '').replace(/\D/g, '') || transaction.user?.phone || ''}</p>
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
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 20;
  // Queries - always fetch ALL transactions (pass large limit to bypass server pagination)
  const { data: allTransactions = [], isLoading, refetch } = useQuery({
    queryKey: ['admin-transactions', 'all'],
    queryFn: () => axios.get('/admin/transactions?limit=10000').then(r => r.data.transactions),
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
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
      queryClient.invalidateQueries({ queryKey: ['admin-payment-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin-members'] });
      queryClient.invalidateQueries({ queryKey: ['total-balance'] });
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
      queryClient.invalidateQueries({ queryKey: ['admin-payment-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin-members'] });
      queryClient.invalidateQueries({ queryKey: ['total-balance'] });
      setRejectingId(null);
    },
    onError: () => {
      toast.error('বাতিল করতে ব্যর্থ হয়েছে');
      setRejectingId(null);
    },
  });

  // Filtered transactions based on status filter and search
  const filteredTransactions = useMemo(() => {
    let result = allTransactions;
    // Apply status filter
    if (filter !== 'all') {
      result = result.filter(tx => tx.status === filter);
    }
    // Apply search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(tx =>
        tx.user?.name?.toLowerCase().includes(term) ||
        tx.user?.memberId?.toLowerCase().includes(term) ||
        tx.user?.phone?.includes(term) ||
        tx.note?.toLowerCase().includes(term)
      );
    }
    return result;
  }, [allTransactions, filter, searchTerm]);

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);
  const paginatedTransactions = filteredTransactions.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  // Stats for display (always from ALL transactions)
  const pendingCount = allTransactions.filter(t => t.status === 'pending').length;
  const approvedCount = allTransactions.filter(t => t.status === 'approved').length;
  const rejectedCount = allTransactions.filter(t => t.status === 'rejected').length;
  const totalAmount = allTransactions
    .filter(t => t.status === 'approved')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const tabs = [
    { key: 'all', label: 'সব', count: allTransactions.length, color: 'blue' },
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

        {/* Pending Request Notification */}
        {pendingCount > 0 && (
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white p-4 rounded-2xl shadow-sm mb-6 animate-pulse">
            <div className="flex items-center gap-3">
              <Bell size={24} className="text-white" />
              <div>
                <p className="font-bold text-lg">নতুন পেমেন্ট অনুরোধ</p>
                <p className="opacity-90">{pendingCount} টি অনুমোদনের অপেক্ষায় আছে</p>
              </div>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatsCard
            title="মোট লেনদেন"
            value={allTransactions.length}
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
              onClick={() => { setFilter(tab.key); setPage(1); }}
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
                  {paginatedTransactions.map(transaction => (
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

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
                <p className="text-xs text-slate-500">
                  {filteredTransactions.length} টির মধ্যে {(page - 1) * ITEMS_PER_PAGE + 1}-{Math.min(page * ITEMS_PER_PAGE, filteredTransactions.length)} দেখানো হচ্ছে
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`w-8 h-8 rounded-lg text-xs font-medium transition ${
                          page === pageNum
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'hover:bg-slate-100 text-slate-600'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
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