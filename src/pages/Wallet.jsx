// client/src/pages/Wallet.jsx
import { useState } from 'react';
import { useAuth } from '../providers/AuthProvider';
import { useQuery } from '@tanstack/react-query';
import useAxios from '../hooks/useAxios';
import { ArrowUpRight, ArrowDownLeft, TrendingUp, Target, Plus, Eye, EyeOff, Wallet as WalletIcon, Calendar, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const BN_MONTHS = ['জানুয়ারি','ফেব্রুয়ারি','মার্চ','এপ্রিল','মে','জুন','জুলাই','আগস্ট','সেপ্টেম্বর','অক্টোবর','নভেম্বর','ডিসেম্বর'];

const Wallet = () => {
  const { dbUser } = useAuth();
  const axios = useAxios();
  const navigate = useNavigate();
  const [showBalance, setShowBalance] = useState(true);
  const [activeTab, setActiveTab] = useState('transactions');

  const { data: transactions = [], isLoading: txLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => axios.get('/member/transactions').then(r => r.data.transactions),
  });

  const { data: targets = [] } = useQuery({
    queryKey: ['targets'],
    queryFn: () => axios.get('/member/targets').then(r => r.data.targets),
  });

  const { data: monthlyData } = useQuery({
    queryKey: ['monthly-status'],
    queryFn: () => axios.get('/member/monthly-status').then(r => r.data),
  });

  const getStatusBadge = (status) => {
    switch(status) {
      case 'approved':
        return { bg: 'bg-green-100', text: 'text-green-700', label: 'অনুমোদিত', icon: <CheckCircle size={12} /> };
      case 'pending':
        return { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'অপেক্ষমাণ', icon: <Clock size={12} /> };
      default:
        return { bg: 'bg-red-100', text: 'text-red-700', label: 'বাতিল', icon: <XCircle size={12} /> };
    }
  };

  return (
    <div className="pb-24">
      {/* Balance Card */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-5 pt-6 pb-8">
        <div className="flex items-center justify-between mb-2">
          <p className="text-blue-200 text-xs">মোট ব্যালেন্স</p>
          <WalletIcon size={16} className="text-blue-200" />
        </div>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-3xl font-bold text-white">
            {showBalance ? `৳${(dbUser?.balance || 0).toLocaleString()}` : '••••••'}
          </span>
          <button 
            onClick={() => setShowBalance(!showBalance)} 
            className="text-blue-200 hover:text-white transition-colors"
          >
            {showBalance ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-blue-100">{dbUser?.name}</span>
          <span className="font-mono text-xs text-blue-200">ID: {dbUser?.memberId}</span>
        </div>
      </div>

      <div className="px-4 -mt-4">
        {/* Action Buttons */}
        <div className="bg-white rounded-2xl p-3 mb-5 shadow-sm border border-gray-100 flex gap-3">
          <button 
            onClick={() => navigate('/')}
            className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl bg-blue-50 active:bg-blue-100 transition-all active:scale-95"
          >
            <Plus size={20} className="text-blue-600" />
            <span className="text-xs font-semibold text-blue-600">টাকা জমা</span>
          </button>
          <button 
            onClick={() => setActiveTab('transactions')}
            className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl bg-gray-50 active:bg-gray-100 transition-all active:scale-95"
          >
            <ArrowDownLeft size={20} className="text-gray-600" />
            <span className="text-xs font-semibold text-gray-600">স্টেটমেন্ট</span>
          </button>
          <button 
            onClick={() => setActiveTab('targets')}
            className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl bg-gray-50 active:bg-gray-100 transition-all active:scale-95"
          >
            <Target size={20} className="text-gray-600" />
            <span className="text-xs font-semibold text-gray-600">লক্ষ্য</span>
          </button>
        </div>

        {/* Monthly Summary */}
        {monthlyData && (
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-gray-500">মাসিক পেমেন্ট {monthlyData.year}</p>
              <Calendar size={14} className="text-gray-400" />
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="grid grid-cols-3 gap-1.5">
                {Object.entries(monthlyData.months).map(([key, info], idx) => {
                  const isFuture = new Date(`${key}-01`) > new Date();
                  let bg = 'bg-gray-50';
                  let text = 'text-gray-400';
                  let icon = '○';
                  
                  if (!isFuture) {
                    if (info.status === 'approved') {
                      bg = 'bg-green-100';
                      text = 'text-green-700';
                      icon = '✓';
                    } else if (info.status === 'pending') {
                      bg = 'bg-yellow-100';
                      text = 'text-yellow-700';
                      icon = '⏳';
                    } else if (info.status === 'unpaid') {
                      bg = 'bg-red-100';
                      text = 'text-red-700';
                      icon = '!';
                    }
                  }
                  
                  return (
                    <div key={key} className={`py-2 rounded-xl text-center ${bg}`}>
                      <div className={`text-sm ${text}`}>{icon}</div>
                      <div className={`text-xs font-medium ${text}`}>{BN_MONTHS[idx]}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-4 p-1 rounded-xl bg-gray-100">
          {[
            { key: 'transactions', label: 'লেনদেন', icon: <ArrowDownLeft size={14} /> },
            { key: 'targets', label: 'লক্ষ্যমাত্রা', icon: <Target size={14} /> }
          ].map(tab => (
            <button 
              key={tab.key} 
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-all active:scale-95 ${
                activeTab === tab.key
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-500'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Transactions Tab */}
        {activeTab === 'transactions' && (
          <>
            {txLoading ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-gray-100">
                <div className="text-5xl mb-3">📊</div>
                <p className="text-gray-400 text-sm">কোনো লেনদেন নেই</p>
              </div>
            ) : (
              <div className="space-y-2">
                {transactions.map(tx => {
                  const status = getStatusBadge(tx.status);
                  const isDeposit = tx.type === 'deposit';
                  
                  return (
                    <div key={tx._id} className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        isDeposit ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {isDeposit ? (
                          <ArrowDownLeft size={18} className="text-green-600" />
                        ) : (
                          <ArrowUpRight size={18} className="text-red-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800">
                          {isDeposit ? 'জমা' : 'উত্তোলন'}
                          {tx.paymentMonth && ` — ${BN_MONTHS[parseInt(tx.paymentMonth.split('-')[1]) - 1]}`}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {new Date(tx.createdAt).toLocaleDateString('bn-BD')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-bold ${isDeposit ? 'text-green-600' : 'text-red-600'}`}>
                          {isDeposit ? '+' : '-'}৳{tx.amount?.toLocaleString()}
                        </p>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${status.bg} ${status.text}`}>
                          {status.icon}
                          {status.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Targets Tab */}
        {activeTab === 'targets' && (
          <>
            {targets.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-gray-100">
                <div className="text-5xl mb-3">🎯</div>
                <p className="text-gray-400 text-sm">কোনো লক্ষ্য নেই</p>
              </div>
            ) : (
              <div className="space-y-3">
                {targets.map(t => {
                  const pct = Math.min(Math.round((t.collected / t.goal) * 100), 100);
                  const isHighProgress = pct >= 60;
                  
                  return (
                    <div key={t._id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="text-sm font-bold text-gray-800">{t.title}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{t.category}</p>
                        </div>
                        <span className={`text-sm font-bold ${isHighProgress ? 'text-green-600' : 'text-orange-600'}`}>
                          {pct}%
                        </span>
                      </div>
                      
                      <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-500 ${
                            isHighProgress ? 'bg-green-500' : 'bg-orange-500'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-semibold text-green-600">
                          ৳{t.collected?.toLocaleString()}
                        </span>
                        <span className="text-xs text-gray-400">
                          লক্ষ্য: ৳{t.goal?.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Wallet;