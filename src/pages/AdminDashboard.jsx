// client/src/pages/AdminDashboard.jsx
import { useQuery } from '@tanstack/react-query';
import useAxios from '../hooks/useAxios';
import { Users, DollarSign, Clock, TrendingUp, Bell, CheckCircle, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const axios = useAxios();
  const navigate = useNavigate();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => axios.get('/admin/stats').then(r => r.data),
  });

  const { data: pendingTx = [] } = useQuery({
    queryKey: ['admin-transactions', 'pending'],
    queryFn: () => axios.get('/admin/transactions?status=pending').then(r => r.data.transactions),
  });

  const statCards = [
    { icon: Users,      label: 'মোট সদস্য',   value: stats?.totalMembers || 0,               color: '#2563eb', bg: '#eff6ff', sub: `+${stats?.newThisMonth || 0} এই মাসে` },
    { icon: DollarSign, label: 'মোট তহবিল',    value: `৳${(stats?.totalBalance || 0).toLocaleString()}`, color: '#16a34a', bg: '#f0fdf4', sub: 'সর্বমোট জমা' },
    { icon: Clock,      label: 'অপেক্ষমাণ',    value: pendingTx.length,                       color: '#ea580c', bg: '#fff7ed', sub: 'অনুমোদন বাকি' },
    { icon: TrendingUp, label: 'এই মাসে',       value: `৳${(stats?.monthlyCollection || 0).toLocaleString()}`, color: '#7c3aed', bg: '#f5f3ff', sub: 'সংগৃহীত' },
  ];

  if (isLoading) return (
    <div className="flex justify-center items-center py-20">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="px-4 py-4 page-enter pb-5">
      <h2 className="text-base font-bold text-slate-800 mb-4" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>অ্যাডমিন ড্যাশবোর্ড</h2>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        {statCards.map(({ icon: Icon, label, value, color, bg, sub }) => (
          <div key={label} className="card p-4">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-2" style={{ background: bg }}>
              <Icon size={18} style={{ color }} />
            </div>
            <p className="text-xl font-bold text-slate-800">{value}</p>
            <p className="text-xs text-slate-500 mt-0.5" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>{label}</p>
            {sub && <p className="text-xs mt-0.5" style={{ color }}>{sub}</p>}
          </div>
        ))}
      </div>

      {/* Pending transactions */}
      {pendingTx.length > 0 && (
        <div className="mb-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Bell size={15} className="text-orange-500" />
              <p className="text-sm font-bold text-slate-700" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>অনুমোদনের অপেক্ষায়</p>
              <span className="badge badge-orange">{pendingTx.length}</span>
            </div>
            <button onClick={() => navigate('/admin/payments')} className="text-xs text-blue-600 font-semibold">সব দেখুন →</button>
          </div>
          <div className="space-y-2">
            {pendingTx.slice(0, 3).map(tx => (
              <div key={tx._id} className="card-sm p-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center font-bold text-slate-500 flex-shrink-0">
                  {tx.user?.avatar ? <img src={tx.user.avatar} className="w-full h-full object-cover" /> : tx.user?.name?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-700 truncate" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>{tx.user?.name}</p>
                  <p className="text-xs text-slate-400 font-mono">{tx.user?.memberId}</p>
                </div>
                <span className="text-green-600 font-bold text-sm">+৳{tx.amount?.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Target progress */}
      {(stats?.targets || []).length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Target size={15} className="text-blue-600" />
            <p className="text-sm font-bold text-slate-700" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>লক্ষ্যমাত্রার অগ্রগতি</p>
          </div>
          <div className="space-y-3">
            {(stats?.targets || []).map(t => {
              const pct = Math.min(Math.round((t.collected / t.goal) * 100), 100);
              return (
                <div key={t._id} className="card p-4">
                  <div className="flex justify-between mb-2">
                    <p className="text-sm font-semibold text-slate-800" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>{t.title}</p>
                    <span className="text-sm font-bold" style={{ color: pct >= 60 ? '#16a34a' : '#ea580c' }}>{pct}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 mb-2">
                    <div className="h-full rounded-full bg-blue-500" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-green-600 font-semibold">৳{t.collected?.toLocaleString()}</span>
                    <span className="text-slate-400">৳{t.goal?.toLocaleString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
