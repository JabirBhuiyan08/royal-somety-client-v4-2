// client/src/pages/AdminPayments.jsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import useAxios from '../hooks/useAxios';
import { CheckCircle, XCircle, Clock, Plus, Filter, Target, User, Calendar, DollarSign, FileText, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const BN_MONTHS = ['জানুয়ারি','ফেব্রুয়ারি','মার্চ','এপ্রিল','মে','জুন','জুলাই','আগস্ট','সেপ্টেম্বর','অক্টোবর','নভেম্বর','ডিসেম্বর'];

// Admin upload on behalf modal
const AdminUploadModal = ({ members, onClose, axios, qc }) => {
  const [form, setForm] = useState({ memberId: '', amount: '', year: '', month: '', note: '', target: '' });
  const [selectedAmountIndex, setSelectedAmountIndex] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed
  const yearOptions = Array.from({ length: 11 }, (_, i) => currentYear - i); // Current year + past 10 years

  // Generate month options based on selected year
  const getMonthOptions = () => {
    const year = form.year ? parseInt(form.year) : currentYear;
    return Array.from({ length: 12 }, (_, i) => {
      const m = String(i + 1).padStart(2, '0');
      const monthDate = new Date(year, i, 1);
      const isFuture = monthDate > now;
      return {
        value: m,
        label: BN_MONTHS[i],
        disabled: isFuture
      };
    });
  };

  const monthOptions = getMonthOptions();

  const { data: targets = [] } = useQuery({
    queryKey: ['admin-targets'],
    queryFn: () => axios.get('/member/targets').then(r => r.data.targets),
  });

  // Filter members based on search query
  const filteredMembers = members.filter(member =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.memberId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (member.email && member.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (member.phone && member.phone.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const mutation = useMutation({
    mutationFn: () => {
      const paymentMonth = `${form.year}-${form.month}`;
      const payload = {
        memberId: form.memberId,
        amount: parseInt(form.amount) || 0,
        paymentMonth,
        note: form.note || '',
        target: form.target || ''
      };
      return axios.post('/admin/transactions/admin-upload', payload);
    },
    onSuccess: () => {
      toast.success('পেমেন্ট যোগ হয়েছে');
      qc.invalidateQueries({ queryKey: ['admin-transactions'] });
      qc.invalidateQueries({ queryKey: ['admin-stats'] });
      qc.invalidateQueries({ queryKey: ['targets'] });
      onClose();
    },
    onError: (error) => {
      console.error('Error:', error.response?.data || error.message);
      toast.error(error.response?.data?.message || 'যোগ করতে ব্যর্থ');
    },
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end justify-center" onClick={onClose}>
      <div className="w-full pb-30 max-w-[480px] bg-white rounded-t-3xl shadow-2xl flex flex-col max-h-[80vh]" onClick={e => e.stopPropagation()}>
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-12 h-1.5 rounded-full bg-gray-300" />
        </div>

        <div className="px-5 pt-2 pb-4 border-b border-gray-100">
          <h3 className="text-xl font-bold text-gray-800">সদস্যের পক্ষে পেমেন্ট যোগ করুন</h3>
          <p className="text-sm text-gray-500 mt-1">সদস্যের জন্য ম্যানুয়ালি পেমেন্ট এন্ট্রি</p>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Member Selection with Search */}
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <User size={16} className="text-blue-500" />
              সদস্য খুঁজুন
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="নাম, ইমেইল, ফোন বা আইডি দিয়ে খুঁজুন"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 bg-gray-50 outline-none mb-2"
            />
            {members.length === 0 ? (
              <div className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 text-sm">
                সদস্য লোড হচ্ছে...
              </div>
            ) : (
              <select
                value={form.memberId}
                onChange={e => {
                  setForm({...form, memberId: e.target.value});
                  setSearchQuery('');
                }}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 bg-gray-50 outline-none"
              >
                <option value="">সদস্য বেছে নিন</option>
                {searchQuery ? (
                  filteredMembers.length > 0 ? (
                    filteredMembers.map(m => (
                      <option key={m._id} value={m._id}>
                        {m.name} — {m.memberId} {m.phone ? `(${m.phone})` : ''}
                      </option>
                    ))
                  ) : (
                    <option disabled>কোনো সদস্য পাওয়া যায়নি</option>
                  )
                ) : (
                  members.map(m => (
                    <option key={m._id} value={m._id}>
                      {m.name} — {m.memberId} {m.phone ? `(${m.phone})` : ''}
                    </option>
                  ))
                )}
              </select>
            )}
          </div>

          {/* Year Selection */}
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <Calendar size={16} className="text-blue-500" />
              সাল
            </label>
            <select
              value={form.year}
              onChange={e => setForm({...form, year: e.target.value, month: ''})}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 bg-gray-50 outline-none"
            >
              <option value="">সাল নির্বাচন করুন</option>
              {yearOptions.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          {/* Month Selection */}
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <Calendar size={16} className="text-blue-500" />
              মাস
            </label>
            <select
              value={form.month}
              onChange={e => setForm({...form, month: e.target.value})}
              disabled={!form.year}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 bg-gray-50 outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">মাস নির্বাচন করুন</option>
              {monthOptions.map(o => (
                <option key={o.value} value={o.value} disabled={o.disabled}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          {/* Amount */}
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <DollarSign size={16} className="text-blue-500" />
              পরিমাণ (৳)
            </label>
            <div className="grid grid-cols-4 gap-2 mb-3">
              {[500, 1000, 2000, 5000].map((amt, idx) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => {
                    setForm({...form, amount: String(amt)});
                    setSelectedAmountIndex(idx);
                  }}
                  className={`py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95 ${
                    selectedAmountIndex === idx
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  ৳{amt}
                </button>
              ))}
            </div>
            <input
              type="number"
              value={form.amount}
              onChange={e => { setForm({...form, amount: e.target.value}); setSelectedAmountIndex(null); }}
              placeholder="অথবা নিজে লিখুন"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 bg-gray-50 outline-none"
            />
          </div>

          {/* Note */}
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <FileText size={16} className="text-blue-500" />
              নোট
            </label>
            <input
              value={form.note}
              onChange={e => setForm({...form, note: e.target.value})}
              placeholder="ঐচ্ছিক নোট"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 bg-gray-50 outline-none"
            />
          </div>

          {/* Target (Optional) */}
          {targets.length > 0 && (
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <Target size={16} className="text-blue-500" />
                লক্ষ্য (ঐচ্ছিক)
              </label>
              <select
                value={form.target}
                onChange={e => setForm({...form, target: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 bg-gray-50 outline-none"
              >
                <option value="">কোনো লক্ষ্য নেই</option>
                {targets.map(t => (
                  <option key={t._id} value={t._id}>
                    {t.title} — ৳{t.goal?.toLocaleString()}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={() => {
              if (!form.memberId) {
                toast.error('সদস্য বেছে নিন');
                return;
              }
              if (!form.year) {
                toast.error('সাল বেছে নিন');
                return;
              }
              if (!form.month) {
                toast.error('মাস বেছে নিন');
                return;
              }
              if (!form.amount) {
                toast.error('পরিমাণ লিখুন');
                return;
              }
              mutation.mutate();
            }}
            disabled={mutation.isPending}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
          >
            {mutation.isPending ? 'যোগ হচ্ছে...' : 'পেমেন্ট যোগ করুন'}
          </button>
        </div>
      </div>
    </div>
  );
};

const AdminPayments = () => {
  const axios = useAxios();
  const qc = useQueryClient();
  const [filter, setFilter] = useState('all');
  const [showUpload, setShowUpload] = useState(false);

  const { data: transactions = [], isLoading } = useQuery({
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

  const approve = useMutation({
    mutationFn: (id) => axios.patch(`/admin/transactions/${id}/approve`),
    onSuccess: () => {
      toast.success('অনুমোদিত');
      qc.invalidateQueries({ queryKey: ['admin-transactions'] });
      qc.invalidateQueries({ queryKey: ['admin-stats'] });
    },
    onError: () => toast.error('অনুমোদন ব্যর্থ'),
  });

  const reject = useMutation({
    mutationFn: (id) => axios.patch(`/admin/transactions/${id}/reject`),
    onSuccess: () => {
      toast.success('বাতিল হয়েছে');
      qc.invalidateQueries({ queryKey: ['admin-transactions'] });
      qc.invalidateQueries({ queryKey: ['admin-stats'] });
    },
    onError: () => toast.error('বাতিল ব্যর্থ'),
  });

  const tabs = [
    { key: 'all',     label: 'সব',      color: 'blue',  bg: 'bg-blue-50',  activeBg: 'bg-blue-500',   icon: <Filter size={14} /> },
    { key: 'pending', label: 'অপেক্ষমাণ', color: 'orange', bg: 'bg-orange-50', activeBg: 'bg-orange-500', icon: <Clock size={14} /> },
    { key: 'approved', label: 'অনুমোদিত',  color: 'green', bg: 'bg-green-50', activeBg: 'bg-green-500', icon: <CheckCircle size={14} /> },
    { key: 'rejected', label: 'বাতিল',      color: 'red', bg: 'bg-red-50', activeBg: 'bg-red-500',     icon: <XCircle size={14} /> },
  ];

  const getStatusConfig = (status) => {
    switch(status) {
      case 'approved': return { bg: 'bg-green-100', text: 'text-green-700', icon: <CheckCircle size={14} />, label: 'অনুমোদিত' };
      case 'pending': return { bg: 'bg-orange-100', text: 'text-orange-700', icon: <Clock size={14} />, label: 'অপেক্ষমাণ' };
      case 'rejected': return { bg: 'bg-red-100', text: 'text-red-700', icon: <XCircle size={14} />, label: 'বাতিল' };
      default: return { bg: 'bg-gray-100', text: 'text-gray-700', icon: <AlertCircle size={14} />, label: 'অজানা' };
    }
  };

  return (
    <div className="px-4 py-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
            <CheckCircle size={20} className="text-blue-600" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-800">পেমেন্ট অনুমোদন</h2>
            <p className="text-xs text-gray-500">সদস্যদের পেমেন্ট অনুমোদন করুন</p>
          </div>
        </div>
        <button
          onClick={() => setShowUpload(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs font-bold shadow-md hover:shadow-lg active:scale-95 transition-all"
        >
          <Plus size={14} />
          <span>ম্যানুয়াল যোগ</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-5">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all active:scale-95 ${
              filter === t.key
                ? `${t.activeBg} text-white shadow-md`
                : `${t.bg} text-gray-600 hover:bg-opacity-80`
            }`}
          >
            {t.icon}
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        /* Transactions Table */
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">সদস্য</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">আইডি</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">মাস</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">পরিমাণ</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">অবস্থা</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">কার্য</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {transactions.map(tx => {
                  const statusConfig = getStatusConfig(tx.status);
                  return (
                    <tr key={tx._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center font-bold text-gray-600 text-xs flex-shrink-0 overflow-hidden">
                            {tx.user?.avatar ? (
                              <img src={tx.user.avatar} className="w-full h-full object-cover" />
                            ) : (
                              tx.user?.name?.[0]
                            )}
                          </div>
                          <span className="text-sm font-medium text-gray-800 truncate max-w-[120px]">{tx.user?.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-gray-500 font-mono">{tx.user?.memberId}</span>
                      </td>
                      <td className="px-4 py-3">
                        {tx.paymentMonth && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                            <Calendar size={10} />
                            {BN_MONTHS[parseInt(tx.paymentMonth.split('-')[1]) - 1]} {tx.paymentMonth.split('-')[0]}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm font-bold text-green-600">+৳{tx.amount?.toLocaleString()}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${statusConfig.bg} ${statusConfig.text}`}>
                          {statusConfig.icon}
                          <span>{statusConfig.label}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {tx.status === 'pending' && (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => approve.mutate(tx._id)}
                              disabled={approve.isPending}
                              className="p-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors disabled:opacity-50"
                              title="অনুমোদন"
                            >
                              <CheckCircle size={14} />
                            </button>
                            <button
                              onClick={() => reject.mutate(tx._id)}
                              disabled={reject.isPending}
                              className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
                              title="বাতিল"
                            >
                              <XCircle size={14} />
                            </button>
                          </div>
                        )}
                        {tx.uploadedByAdmin && (
                          <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-500 mt-1">
                            অ্যাডমিন
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {transactions.length === 0 && !isLoading && (
            <div className="text-center py-16">
              <div className="text-5xl mb-3">📋</div>
              <p className="text-gray-400 text-sm">কোনো লেনদেন নেই</p>
            </div>
          )}
        </div>
      )}

      {/* Upload Modal */}
      {showUpload && <AdminUploadModal members={members} onClose={() => setShowUpload(false)} axios={axios} qc={qc} />}
    </div>
  );
};

export default AdminPayments;