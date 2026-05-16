// client/src/pages/AdminDashboard.jsx
import { useQuery } from '@tanstack/react-query';
import useAxios from '../hooks/useAxios';
import { 
  Users, DollarSign, Clock, TrendingUp, Bell, CheckCircle, 
  Target, Calendar, Wallet, ArrowUpRight, ArrowDownRight,
  Loader2, RefreshCw, Crown, Gift, Activity, PieChart
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { normalizeMemberId } from '../utils/constants';

// ==================== COMPONENTS ====================

const LoadingSpinner = () => (
  <div className="flex justify-center items-center py-20">
    <Loader2 size={32} className="animate-spin text-blue-500" />
  </div>
);

const StatCard = ({ icon: Icon, label, value, subValue, color, bg, trend }) => {
  const isPositive = trend >= 0;
  
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 hover:shadow-md transition-all duration-200">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: bg }}>
          <Icon size={20} style={{ color }} />
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            <span>{Math.abs(trend)}%</span>
          </div>
        )}
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
        <p className="text-xs text-slate-500 mt-1">{label}</p>
        {subValue && <p className="text-xs mt-1" style={{ color }}>{subValue}</p>}
      </div>
    </div>
  );
};

const PendingTransactionCard = ({ transaction, onClick }) => {
  const date = new Date(transaction.createdAt);
  const formattedDate = date.toLocaleDateString('bn-BD', { day: 'numeric', month: 'short' });
  
  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-xl p-3 border border-slate-100 hover:shadow-md hover:border-orange-200 transition-all duration-200 cursor-pointer"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl overflow-hidden bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center flex-shrink-0">
          {transaction.user?.avatar ? (
            <img src={transaction.user.avatar} className="w-full h-full object-cover" alt={transaction.user.name} />
          ) : (
            <span className="text-sm font-bold text-orange-600">
              {transaction.user?.name?.[0]?.toUpperCase()}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-slate-800 truncate">{transaction.user?.name}</p>
            <span className="text-green-600 font-bold text-sm">+৳{transaction.amount?.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-xs text-slate-400 font-mono">{normalizeMemberId(transaction.user?.memberId)}</p>
            <span className="w-1 h-1 rounded-full bg-slate-300" />
            <p className="text-xs text-slate-400">{formattedDate}</p>
          </div>
          {transaction.note && (
            <p className="text-xs text-slate-500 mt-1 line-clamp-1">{transaction.note}</p>
          )}
        </div>
        <div className="flex-shrink-0">
          <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
        </div>
      </div>
    </div>
  );
};

const TargetProgressCard = ({ target, onClick }) => {
  const percentage = Math.min(Math.round((target.collected / target.goal) * 100), 100);
  const isCompleted = percentage >= 100;
  const isNearComplete = percentage >= 70 && percentage < 100;
  
  const progressColor = isCompleted ? 'bg-green-500' : isNearComplete ? 'bg-amber-500' : 'bg-blue-500';
  const textColor = isCompleted ? 'text-green-600' : isNearComplete ? 'text-amber-600' : 'text-blue-600';
  
  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-xl p-4 border border-slate-100 hover:shadow-md hover:border-blue-200 transition-all duration-200 cursor-pointer"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-slate-800">{target.title}</h3>
            {isCompleted && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs">
                <CheckCircle size={10} /> সম্পন্ন
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500">{target.category}</p>
        </div>
        <span className={`text-sm font-bold ${textColor}`}>{percentage}%</span>
      </div>
      
      <div className="space-y-2">
        <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-green-600 font-semibold">৳{target.collected?.toLocaleString()}</span>
          <span className="text-slate-400">লক্ষ্য: ৳{target.goal?.toLocaleString()}</span>
        </div>
      </div>
      
      {target.deadline && !isCompleted && (
        <div className="mt-3 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <Calendar size={12} />
            <span>শেষ তারিখ: {new Date(target.deadline).toLocaleDateString('bn-BD')}</span>
          </div>
        </div>
      )}
    </div>
  );
};

const QuickActionButton = ({ icon: Icon, label, onClick, color }) => (
  <button
    onClick={onClick}
    className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white border border-slate-200 hover:shadow-md transition-all duration-200"
  >
    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}10` }}>
      <Icon size={20} style={{ color }} />
    </div>
    <span className="text-xs font-medium text-slate-600">{label}</span>
  </button>
);

// ==================== MAIN COMPONENT ====================

const AdminDashboard = () => {
  const axios = useAxios();
  const navigate = useNavigate();

  const { data: stats, isLoading, refetch } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => axios.get('/admin/stats').then(r => r.data),
  });

  const { data: pendingTx = [], refetch: refetchPending } = useQuery({
    queryKey: ['admin-transactions', 'pending'],
    queryFn: () => axios.get('/admin/transactions?status=pending').then(r => r.data.transactions),
  });

  const { data: recentActivities = [] } = useQuery({
    queryKey: ['admin-recent-activities'],
    queryFn: () => axios.get('/admin/recent-activities').then(r => r.data.activities || []),
    enabled: false, // Optional: enable if you have this endpoint
  });

  const statCards = [
    { 
      icon: Users, 
      label: 'মোট সদস্য', 
      value: stats?.totalMembers || 0, 
      subValue: `+${stats?.newThisMonth || 0} জন এই মাসে`,
      color: '#2563eb', 
      bg: '#eff6ff',
      trend: stats?.memberGrowthRate || 5.2
    },
    { 
      icon: Wallet, 
      label: 'মোট তহবিল', 
      value: `৳${(stats?.totalBalance || 0).toLocaleString()}`, 
      subValue: `${stats?.totalTransactions || 0} টি লেনদেন`,
      color: '#16a34a', 
      bg: '#f0fdf4',
      trend: stats?.fundGrowthRate || 8.1
    },
    { 
      icon: Clock, 
      label: 'অপেক্ষমাণ লেনদেন', 
      value: pendingTx.length, 
      subValue: 'অনুমোদনের অপেক্ষায়',
      color: '#ea580c', 
      bg: '#fff7ed',
    },
    { 
      icon: TrendingUp, 
      label: 'এই মাসের সংগ্রহ', 
      value: `৳${(stats?.monthlyCollection || 0).toLocaleString()}`, 
      subValue: `গত মাস থেকে ${stats?.monthlyGrowth || 0}% বেশি`,
      color: '#7c3aed', 
      bg: '#f5f3ff',
      trend: stats?.monthlyGrowth || 12.5
    },
  ];

  const quickActions = [
    { icon: DollarSign, label: 'লেনদেন করুন', onClick: () => navigate('/admin/payments'), color: '#2563eb' },
    { icon: Bell, label: 'নোটিফিকেশন', onClick: () => navigate('/admin/notifications'), color: '#ea580c' },
    { icon: Target, label: 'লক্ষ্য নির্ধারণ', onClick: () => navigate('/admin/settings'), color: '#16a34a' },
    { icon: Users, label: 'সদস্য ব্যবস্থাপনা', onClick: () => navigate('/admin/members'), color: '#7c3aed' },
  ];

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-slate-50 pb-8">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2">
              <Crown size={24} className="text-amber-500" />
              <h1 className="text-2xl font-bold text-slate-800">অ্যাডমিন ড্যাশবোর্ড</h1>
            </div>
            <p className="text-slate-500 mt-1">স্বাগতম! আপনার সংস্থার সর্বশেষ অবস্থা এখানে দেখুন</p>
          </div>
          <button
            onClick={() => {
              refetch();
              refetchPending();
            }}
            className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 transition"
          >
            <RefreshCw size={18} className="text-slate-500" />
          </button>
        </div>

        {/* Welcome Banner */}
        {stats?.lastLogin && (
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
            <div className="flex items-center gap-3">
              <Activity size={20} className="text-blue-600" />
              <div>
                <p className="text-sm text-slate-600">শেষ লগইন: {new Date(stats.lastLogin).toLocaleString('bn-BD')}</p>
                <p className="text-xs text-slate-500 mt-0.5">সর্বশেষ আপডেট: এখনই</p>
              </div>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((card, index) => (
            <StatCard key={index} {...card} />
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-base font-semibold text-slate-700 mb-3">দ্রুত কার্যক্রম</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {quickActions.map((action, index) => (
              <QuickActionButton key={index} {...action} />
            ))}
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pending Transactions */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Clock size={18} className="text-orange-500" />
                <h2 className="text-base font-semibold text-slate-700">অনুমোদনের অপেক্ষায়</h2>
                {pendingTx.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 text-xs font-medium">
                    {pendingTx.length}
                  </span>
                )}
              </div>
              {pendingTx.length > 0 && (
                <button 
                  onClick={() => navigate('/admin/payments')} 
                  className="text-xs text-blue-600 font-medium hover:text-blue-700 transition"
                >
                  সব দেখুন →
                </button>
              )}
            </div>
            
            {pendingTx.length === 0 ? (
              <div className="bg-white rounded-xl p-8 text-center border border-slate-100">
                <CheckCircle size={40} className="mx-auto text-green-400 mb-2" />
                <p className="text-sm text-slate-500">কোনো অপেক্ষমাণ লেনদেন নেই</p>
                <p className="text-xs text-slate-400 mt-1">সব লেনদেন অনুমোদিত হয়েছে</p>
              </div>
            ) : (
              <div className="space-y-2">
                {pendingTx.slice(0, 5).map(transaction => (
                  <PendingTransactionCard 
                    key={transaction._id} 
                    transaction={transaction}
                    onClick={() => navigate('/admin/payments')}
                  />
                ))}
                {pendingTx.length > 5 && (
                  <button 
                    onClick={() => navigate('/admin/payments')}
                    className="w-full text-center py-2 text-sm text-blue-600 font-medium hover:text-blue-700 transition"
                  >
                    আরও {pendingTx.length - 5} টি লেনদেন দেখুন
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Target Progress */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Target size={18} className="text-blue-600" />
                <h2 className="text-base font-semibold text-slate-700">লক্ষ্যমাত্রার অগ্রগতি</h2>
                {(stats?.targets || []).length > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
                    {(stats?.targets || []).length}
                  </span>
                )}
              </div>
              {(stats?.targets || []).length > 0 && (
                <button 
                  onClick={() => navigate('/admin/settings')} 
                  className="text-xs text-blue-600 font-medium hover:text-blue-700 transition"
                >
                  সব লক্ষ্য →
                </button>
              )}
            </div>
            
            {(stats?.targets || []).length === 0 ? (
              <div className="bg-white rounded-xl p-8 text-center border border-slate-100">
                <Target size={40} className="mx-auto text-slate-300 mb-2" />
                <p className="text-sm text-slate-500">কোনো লক্ষ্য নির্ধারণ করা নেই</p>
                <button 
                  onClick={() => navigate('/admin/settings')}
                  className="mt-3 text-sm text-blue-600 font-medium hover:text-blue-700 transition"
                >
                  নতুন লক্ষ্য তৈরি করুন →
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {(stats?.targets || []).slice(0, 3).map(target => (
                  <TargetProgressCard 
                    key={target._id} 
                    target={target}
                    onClick={() => navigate('/admin/settings')}
                  />
                ))}
                {(stats?.targets || []).length > 3 && (
                  <button 
                    onClick={() => navigate('/admin/settings')}
                    className="w-full text-center py-2 text-sm text-blue-600 font-medium hover:text-blue-700 transition"
                  >
                    আরও {(stats?.targets || []).length - 3} টি লক্ষ্য দেখুন
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity Section (Optional) */}
        {recentActivities.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center gap-2 mb-3">
              <Activity size={18} className="text-slate-600" />
              <h2 className="text-base font-semibold text-slate-700">সাম্প্রতিক কার্যক্রম</h2>
            </div>
            <div className="bg-white rounded-xl border border-slate-100 divide-y divide-slate-100">
              {recentActivities.slice(0, 5).map((activity, index) => (
                <div key={index} className="p-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                    <Gift size={14} className="text-slate-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-slate-700">{activity.description}</p>
                    <p className="text-xs text-slate-400">{new Date(activity.createdAt).toLocaleString('bn-BD')}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;