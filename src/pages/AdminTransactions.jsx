// client/src/pages/AdminTransactions.jsx
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import useAxios from '../hooks/useAxios';
import {
  ChevronLeft, ChevronRight, Search, CreditCard, Calendar, User, DollarSign
} from 'lucide-react';

const ITEMS_PER_PAGE = 20;

const AdminTransactions = () => {
  const axios = useAxios();
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all'); // all, deposit, withdrawal
  const [sortBy, setSortBy] = useState('date'); // date, amount, name
  const [sortAsc, setSortAsc] = useState(false);

  // Fetch each status separately using existing endpoints
  const { data: pending = [], isLoading: loadingPending } = useQuery({
    queryKey: ['admin-transactions', 'pending'],
    queryFn: () => axios.get('/admin/transactions?status=pending').then(r => r.data.transactions || []),
  });

  const { data: approved = [], isLoading: loadingApproved } = useQuery({
    queryKey: ['admin-transactions', 'approved'],
    queryFn: () => axios.get('/admin/transactions?status=approved').then(r => r.data.transactions || []),
  });

  const { data: rejected = [], isLoading: loadingRejected } = useQuery({
    queryKey: ['admin-transactions', 'rejected'],
    queryFn: () => axios.get('/admin/transactions?status=rejected').then(r => r.data.transactions || []),
  });

  const isLoading = loadingPending || loadingApproved || loadingRejected;

  // Combine all transactions
  const allTransactions = useMemo(() => {
    return [...pending, ...approved, ...rejected]
      .filter(tx => tx != null)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [pending, approved, rejected]);

  // Compute stats
  const stats = useMemo(() => {
    const depositCount = allTransactions.filter(tx => tx.type === 'deposit').length;
    const withdrawalCount = allTransactions.filter(tx => tx.type === 'withdrawal').length;
    const totalAmount = allTransactions
      .filter(tx => tx.type === 'deposit' && tx.status === 'approved')
      .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
    return { depositCount, withdrawalCount, totalAmount };
  }, [allTransactions]);

  // Filter
  const filteredTransactions = useMemo(() => {
    let result = allTransactions;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(tx =>
        (tx.user?.name?.toLowerCase() || '').includes(q) ||
        (tx.user?.memberId?.toLowerCase() || '').includes(q)
      );
    }
    if (typeFilter !== 'all') {
      result = result.filter(tx => tx.type === typeFilter);
    }
    // Sort
    result.sort((a, b) => {
      let valA, valB;
      switch (sortBy) {
        case 'amount': valA = a.amount; valB = b.amount; break;
        case 'name': valA = a.user?.name || ''; valB = b.user?.name || ''; break;
        default: valA = new Date(a.createdAt).getTime(); valB = new Date(b.createdAt).getTime();
      }
      if (sortAsc) return valA > valB ? 1 : -1;
      return valA < valB ? 1 : -1;
    });
    return result;
  }, [allTransactions, searchQuery, typeFilter, sortBy, sortAsc]);

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);
  const paginatedTransactions = filteredTransactions.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortBy(field);
      setSortAsc(false);
    }
  };

  const formatCurrency = (amount) => `৳${Number(amount || 0).toLocaleString()}`;
  const formatDate = (date) => {
    try {
      return new Date(date).toLocaleDateString('bn-BD', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return 'N/A';
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      approved: 'bg-green-100 text-green-700',
      pending: 'bg-yellow-100 text-yellow-700',
      rejected: 'bg-red-100 text-red-700',
    };
    const labels = {
      approved: 'অনুমোদিত',
      pending: 'অপেক্ষমাণ',
      rejected: 'বাতিল',
    };
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-700'}`}>
        {labels[status] || status}
      </span>
    );
  };

  return (
    <div className="px-4 py-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
            <CreditCard size={20} className="text-blue-600" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-800">সকল লেনদেন</h2>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-white rounded-xl p-2.5 shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500">মোট</p>
          <p className="text-lg font-bold text-blue-600">{formatCurrency(stats.totalAmount)}</p>
        </div>
        <div className="bg-white rounded-xl p-2.5 shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500">জমা</p>
          <p className="text-lg font-bold text-green-600">{stats.depositCount}</p>
        </div>
        <div className="bg-white rounded-xl p-2.5 shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500">উত্তোলন</p>
          <p className="text-lg font-bold text-red-600">{stats.withdrawalCount}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-3">
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
            placeholder="সদস্য খুঁজুন..."
            className="w-full pl-8 pr-3 py-2 rounded-lg border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 bg-white outline-none text-sm"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-lg border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 bg-white outline-none text-sm"
        >
          <option value="all">সব</option>
          <option value="deposit">জমা</option>
          <option value="withdrawal">উত্তোলন</option>
        </select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : paginatedTransactions.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <p className="text-gray-400 text-sm">কোনো লেনদেন পাওয়া যায়নি</p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto bg-white rounded-xl border border-gray-200">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    className="px-3 py-2 text-left text-xs font-semibold text-gray-600 cursor-pointer hover:bg-gray-100"
                    onClick={() => toggleSort('date')}
                  >
                    <div className="flex items-center gap-1">
                      তারিখ
                      {sortBy === 'date' && <span className="text-[10px]">{sortAsc ? '↑' : '↓'}</span>}
                    </div>
                  </th>
                  <th 
                    className="px-3 py-2 text-left text-xs font-semibold text-gray-600 cursor-pointer hover:bg-gray-100"
                    onClick={() => toggleSort('name')}
                  >
                    <div className="flex items-center gap-1">
                      সদস্য
                      {sortBy === 'name' && <span className="text-[10px]">{sortAsc ? '↑' : '↓'}</span>}
                    </div>
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">আইডি</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">মাস</th>
                  <th 
                    className="px-3 py-2 text-right text-xs font-semibold text-gray-600 cursor-pointer hover:bg-gray-100"
                    onClick={() => toggleSort('amount')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      পরিমাণ
                      {sortBy === 'amount' && <span className="text-[10px]">{sortAsc ? '↑' : '↓'}</span>}
                    </div>
                  </th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600">স্ট্যাটাস</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedTransactions.map(tx => (
                  <tr key={tx._id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 text-xs text-gray-700 whitespace-nowrap">
                      {formatDate(tx.createdAt)}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-600">
                          {tx.user?.name?.[0] || '?'}
                        </div>
                        <span className="text-xs font-medium text-gray-800 truncate max-w-[80px]">
                          {tx.user?.name || 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-500 font-mono">
                      {tx.user?.memberId || '—'}
                    </td>
                    <td className="px-3 py-2">
                      {tx.paymentMonth ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-blue-50 text-blue-600">
                          <Calendar size={10} />
                          {tx.paymentMonth}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className={`px-3 py-2 text-right text-sm font-bold ${tx.type === 'deposit' ? 'text-green-600' : 'text-red-600'}`}>
                      {tx.type === 'deposit' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {getStatusBadge(tx.status)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-2">
            {paginatedTransactions.map(tx => (
              <div key={tx._id} className="bg-white rounded-xl p-3 border border-gray-200">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600">
                      {tx.user?.name?.[0] || '?'}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-800">{tx.user?.name || 'N/A'}</p>
                      <p className="text-[10px] text-gray-400">{tx.user?.memberId}</p>
                    </div>
                  </div>
                  <span className={`text-sm font-bold ${tx.type === 'deposit' ? 'text-green-600' : 'text-red-600'}`}>
                    {tx.type === 'deposit' ? '+' : '-'}{formatCurrency(tx.amount)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">{formatDate(tx.createdAt)}</span>
                    {tx.paymentMonth && (
                      <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px]">
                        <Calendar size={10} className="inline" /> {tx.paymentMonth}
                      </span>
                    )}
                  </div>
                  <span>{getStatusBadge(tx.status)}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-4">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="w-8 h-8 rounded-lg flex items-center justify-center bg-white border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 active:scale-95 transition-all"
          >
            <ChevronLeft size={14} className="text-gray-600" />
          </button>

          {[...Array(totalPages)].map((_, i) => {
            const p = i + 1;
            if (totalPages <= 7 || p === 1 || p === totalPages || (p >= page - 1 && p <= page + 1)) {
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all active:scale-95 ${
                    page === p ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {p}
                </button>
              );
            } else if (p === page - 2 || p === page + 2) {
              return <span key={p} className="text-gray-400 text-xs">…</span>;
            }
            return null;
          })}

          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="w-8 h-8 rounded-lg flex items-center justify-center bg-white border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 active:scale-95 transition-all"
          >
            <ChevronRight size={14} className="text-gray-600" />
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminTransactions;
