// client/src/pages/AdminPayments.jsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import useAxios from '../hooks/useAxios';
import { CheckCircle, XCircle, Clock, Plus, Filter, Target, User, Calendar, DollarSign, FileText, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const BN_MONTHS = ['জানুয়ারি','ফেব্রুয়ারি','মার্চ','এপ্রিল','মে','জুন','জুলাই','আগস্ট','সেপ্টেম্বর','অক্টোবর','নভেম্বর','ডিসেম্বর'];

// Admin upload on behalf modal
const AdminUploadModal = ({ members, onClose, axios, qc }) => {
  const [form, setForm] = useState({ memberId: '', amount: '', paymentMonth: '', note: '', target: '' });
  const [selectedAmountIndex, setSelectedAmountIndex] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed
  const yearOptions = Array.from({ length: 11 }, (_, i) => currentYear - i); // Current year + past 10 years

  // Generate month options based on selected year
  const getMonthOptions = (selectedYear) => {
    const year = selectedYear ? parseInt(selectedYear) : currentYear;
    return Array.from({ length: 12 }, (_, i) => {
      const m = String(i + 1).padStart(2, '0');
      const monthDate = new Date(year, i, 1);
      const isFuture = monthDate > now;
      return { 
        value: `${year}-${m}`, 
        label: BN_MONTHS[i],
        disabled: isFuture 
      };
    });
  };

  const selectedYear = form.paymentMonth ? form.paymentMonth.split('-')[0] : '';
  const monthOptions = getMonthOptions(selectedYear);

  const { data: targets = [] } = useQuery({
    queryKey: ['admin-targets'],
    queryFn: () => axios.get('/member/targets').then(r => r.data.targets),
  });

  // Filter members based on search query
  const filteredMembers = members.filter(member =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.memberId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const mutation = useMutation({
    mutationFn: () => axios.post('/admin/transactions/admin-upload', form),
    onSuccess: () => { 
      toast.success('পেমেন্ট যোগ হয়েছে'); 
      qc.invalidateQueries(['admin-transactions']); 
      qc.invalidateQueries(['admin-stats']); 
      qc.invalidateQueries(['targets']); 
      onClose(); 
    },
    onError: () => toast.error('যোগ করতে ব্যর্থ'),
  });

  return (
    <div className="fixed inset-0 z-50 mb-16 bg-black/50 backdrop-blur-sm flex items-end justify-center" onClick={onClose}>
      <div className="w-full max-w-[480px] bg-white rounded-t-3xl shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-12 h-1.5 rounded-full bg-gray-300" />
        </div>
        
        <div className="px-5 pt-2 pb-4 border-b border-gray-100">
          <h3 className="text-xl font-bold text-gray-800">সদস্যের পক্ষে পেমেন্ট যোগ করুন</h3>
          <p className="text-sm text-gray-500 mt-1">সদস্যের জন্য ম্যানুয়ালি পেমেন্ট এন্ট্রি</p>
        </div>

        <div className="p-5 space-y-4">
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
              placeholder="নাম বা আইডি দিয়ে খুঁজুন"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 bg-gray-50 outline-none mb-2"
            />
            <select 
              value={form.memberId} 
              onChange={e => setForm({...form, memberId: e.target.value})} 
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 bg-gray-50 outline-none"
            >
              <option value="">সদস্য বেছে নিন</option>
              {filteredMembers.map(m => (
                <option key={m._id} value={m._id}>
                  {m.name} — {m.memberId} {m.phone ? `(${m.phone})` : ''}
                </option>
              ))}
            </select>
            {filteredMembers.length === 0 && searchQuery && (
              <p className="text-xs text-gray-400 mt-1">কোনো সদস্য পাওয়া যায়নি</p>
            )}
          </div>

          {/* Year Selection */}
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <Calendar size={16} className="text-blue-500" />
              সাল
            </label>
            <select 
              value={selectedYear}
              onChange={e => {
                const year = e.target.value;
                if (year) {
                  // Reset month to January when year changes
                  setForm({...form, paymentMonth: `${year}-01`});
                } else {
                  setForm({...form, paymentMonth: ''});
                }
              }}
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
              value={form.paymentMonth ? form.paymentMonth.split('-')[1] : ''}
              onChange={e => {
                const month = e.target.value;
                if (month && selectedYear) {
                  setForm({...form, paymentMonth: `${selectedYear}-${month}`});
                }
              }}
              disabled={!selectedYear}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 bg-gray-50 outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">মাস নির্বাচন করুন</option>
              {monthOptions.map(o => (
                <option key={o.value} value={o.value.split('-')[1]} disabled={o.disabled}>
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
            onClick={() => mutation.mutate()} 
            disabled={!form.memberId || !form.amount || !form.paymentMonth || mutation.isPending} 
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
  const [filter, setFilter] = useState('pending');
  const [showUpload, setShowUpload] = useState(false);

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['admin-transactions', filter],
    queryFn: () => axios.get(`/admin/transactions?status=${filter}`).then(r => r.data.transactions),
  });

  const { data: members = [] } = useQuery({
    queryKey: ['admin-members'],
    queryFn: () => axios.get('/admin/members').then(r => r.data.members),
  });

  const approve = useMutation({
    mutationFn: (id) => axios.patch(`/admin/transactions/${id}/approve`),
    onSuccess: () => { 
      toast.success('অনুমোদিত'); 
      qc.invalidateQueries(['admin-transactions']); 
      qc.invalidateQueries(['admin-stats']); 
    },
    onError: () => toast.error('অনুমোদন ব্যর্থ'),
  });

  const reject = useMutation({
    mutationFn: (id) => axios.patch(`/admin/transactions/${id}/reject`),
    onSuccess: () => { 
      toast.success('বাতিল হয়েছে'); 
      qc.invalidateQueries(['admin-transactions']); 
    },
    onError: () => toast.error('বাতিল ব্যর্থ'),
  });

  const tabs = [
    { key: 'pending',  label: 'অপেক্ষমাণ', color: 'orange', bg: 'bg-orange-50', activeBg: 'bg-orange-500', icon: <Clock size={14} /> },
    { key: 'approved', label: 'অনুমোদিত',  color: 'green', bg: 'bg-green-50', activeBg: 'bg-green-500', icon: <CheckCircle size={14} /> },
    { key: 'rejected', label: 'বাতিল',      color: 'red', bg: 'bg-red-50', activeBg: 'bg-red-500', icon: <XCircle size={14} /> },
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
      ) : transactions.length === 0 ? (
        /* Empty State */
        <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="text-5xl mb-3">📋</div>
          <p className="text-gray-400 text-sm">কোনো লেনদেন নেই</p>
        </div>
      ) : (
        /* Transactions List */
        <div className="space-y-3">
          {transactions.map(tx => {
            const statusConfig = getStatusConfig(tx.status);
            return (
              <div key={tx._id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                {/* User Info Row */}
                <div className="flex items-center gap-3 mb-3">
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center font-bold text-gray-600">
                    {tx.user?.avatar ? (
                      <img src={tx.user.avatar} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-lg">{tx.user?.name?.[0]}</span>
                    )}
                  </div>
                  
                  {/* User Details */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{tx.user?.name}</p>
                    <p className="text-xs text-gray-500 font-mono">ID: {tx.user?.memberId}</p>
                    {tx.paymentMonth && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 mt-1">
                        <Calendar size={10} />
                        {BN_MONTHS[parseInt(tx.paymentMonth.split('-')[1]) - 1]} {tx.paymentMonth.split('-')[0]}
                      </span>
                    )}
                  </div>
                  
                  {/* Amount */}
                  <div className="text-right">
                    <p className="font-bold text-green-600 text-lg">+৳{tx.amount?.toLocaleString()}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(tx.createdAt).toLocaleDateString('bn-BD')}
                    </p>
                    {tx.uploadedByAdmin && (
                      <span className="inline-block px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 mt-1">
                        অ্যাডমিন
                      </span>
                    )}
                  </div>
                </div>

                {/* Note */}
                {tx.note && (
                  <div className="mb-3 px-3 py-2 rounded-xl bg-gray-50 border border-gray-100">
                    <p className="text-xs text-gray-600">{tx.note}</p>
                  </div>
                )}

                {/* Status Badge */}
                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium mb-3 ${statusConfig.bg} ${statusConfig.text}`}>
                  {statusConfig.icon}
                  <span>{statusConfig.label}</span>
                </div>

                {/* Action Buttons (only for pending) */}
                {tx.status === 'pending' && (
                  <div className="flex gap-2 mt-3 pt-2 border-t border-gray-100">
                    <button 
                      onClick={() => approve.mutate(tx._id)} 
                      disabled={approve.isPending}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 active:scale-95 transition-all"
                    >
                      <CheckCircle size={15} />
                      <span>অনুমোদন</span>
                    </button>
                    <button 
                      onClick={() => reject.mutate(tx._id)} 
                      disabled={reject.isPending}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 active:scale-95 transition-all"
                    >
                      <XCircle size={15} />
                      <span>বাতিল</span>
                    </button>
                  </div>
                )}

                {/* Status Message (for approved/rejected) */}
                {tx.status !== 'pending' && (
                  <div className="mt-2 pt-2 border-t border-gray-100">
                    <div className={`flex items-center gap-1.5 text-xs ${statusConfig.text}`}>
                      {statusConfig.icon}
                      <span>
                        {tx.status === 'approved' ? 'অনুমোদিত হয়েছে' : 'বাতিল হয়েছে'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Modal */}
      {showUpload && <AdminUploadModal members={members} onClose={() => setShowUpload(false)} axios={axios} qc={qc} />}
    </div>
  );
};

export default AdminPayments;