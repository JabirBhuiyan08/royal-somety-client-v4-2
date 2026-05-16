// client/src/pages/AdminMembers.jsx
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import useAxios from '../hooks/useAxios';
import { 
  Search, Users, Crown, Trash2, Shield, Bell, ChevronDown, 
  ChevronUp, Phone, Mail, Filter, X, AlertCircle, UserCheck, 
  UserX, MoreVertical, Loader2 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { normalizeMemberId } from '../utils/constants';

// ==================== COMPONENTS ====================

const LoadingSpinner = () => (
  <div className="flex justify-center py-16">
    <Loader2 size={32} className="animate-spin text-blue-500" />
  </div>
);

const EmptyState = ({ message }) => (
  <div className="text-center py-12 bg-white rounded-xl border border-slate-100">
    <Users size={48} className="mx-auto text-slate-300 mb-3" />
    <p className="text-slate-500">{message}</p>
  </div>
);

const DueModal = ({ member, onClose }) => {
  const axios = useAxios();
  const [amount, setAmount] = useState('');
  
  const mutation = useMutation({
    mutationFn: () => axios.post('/admin/transactions/due-reminder', { 
      userId: member._id, 
      dueAmount: Number(amount) 
    }),
    onSuccess: () => { 
      toast.success('রিমাইন্ডার পাঠানো হয়েছে'); 
      onClose(); 
    },
    onError: () => toast.error('পাঠানো ব্যর্থ'),
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-[400px] bg-white rounded-2xl shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-800">বকেয়া রিমাইন্ডার</h3>
          <p className="text-sm text-slate-500 mt-1">{member.name}</p>
        </div>
        
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">বকেয়া পরিমাণ (৳)</label>
            <input 
              type="number" 
              value={amount} 
              onChange={e => setAmount(e.target.value)} 
              placeholder="যেমন: 5000"
              className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
              autoFocus
            />
          </div>
          
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
            <div className="flex items-start gap-2">
              <AlertCircle size={16} className="text-amber-600 mt-0.5" />
              <p className="text-xs text-amber-700">
                অ্যাপ নোটিফিকেশন, ইমেইল ও WhatsApp এর মাধ্যমে রিমাইন্ডার পাঠানো হবে।
              </p>
            </div>
          </div>
        </div>
        
        <div className="p-5 border-t border-slate-100 flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition">
            বাতিল
          </button>
          <button 
            onClick={() => mutation.mutate()} 
            disabled={!amount || mutation.isPending} 
            className="flex-1 px-4 py-2 rounded-xl bg-orange-500 text-white font-medium hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {mutation.isPending ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'রিমাইন্ডার পাঠান'}
          </button>
        </div>
      </div>
    </div>
  );
};

const MemberCard = ({ member, isExpanded, onToggleExpand, onDueReminder, onRoleChange, onDelete }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-all duration-200">
      {/* Card Header */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className={`w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-br ${member.role === 'admin' ? 'from-blue-500 to-blue-600' : 'from-slate-100 to-slate-200'} flex items-center justify-center`}>
            {member.avatar ? (
              <img src={member.avatar} className="w-full h-full object-cover" alt={member.name} />
            ) : (
              <span className={`text-lg font-bold ${member.role === 'admin' ? 'text-white' : 'text-slate-600'}`}>
                {member.name?.[0]?.toUpperCase()}
              </span>
            )}
          </div>
          
          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-slate-900 truncate">{member.name}</h3>
              {member.role === 'admin' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-xs font-medium">
                  <Crown size={10} /> অ্যাডমিন
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              {member.phone && (
                <a href={`tel:${member.phone}`} className="flex items-center gap-1 text-xs text-slate-500 hover:text-green-600 transition">
                  <Phone size={10} /> {member.phone}
                </a>
              )}
              {member.email && (
                <span className="flex items-center gap-1 text-xs text-slate-400">
                  <Mail size={10} /> {member.email}
                </span>
              )}
            </div>
            
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-green-600">৳{(member.balance || 0).toLocaleString()}</span>
                {member.bloodGroup && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-600">🩸 {member.bloodGroup}</span>
                )}
              </div>
              
              <button 
                onClick={onToggleExpand} 
                className="p-1.5 rounded-lg hover:bg-slate-100 transition"
              >
                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Expanded Actions */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-2 border-t border-slate-50">
          <div className="grid grid-cols-2 gap-2">
            {member.phone && (
              <a 
                href={`tel:${member.phone}`} 
                className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-green-50 text-green-600 text-sm font-medium hover:bg-green-100 transition"
              >
                <Phone size={14} /> কল করুন
              </a>
            )}
            
            <button 
              onClick={() => onDueReminder(member)}
              className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-amber-50 text-amber-600 text-sm font-medium hover:bg-amber-100 transition"
            >
              <Bell size={14} /> বকেয়া রিমাইন্ডার
            </button>
            
            <button 
              onClick={() => onRoleChange(member)}
              className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
                member.role === 'admin' 
                  ? 'bg-blue-50 text-blue-600 hover:bg-blue-100' 
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {member.role === 'admin' ? <UserX size={14} /> : <UserCheck size={14} />}
              {member.role === 'admin' ? 'অ্যাডমিন সরান' : 'অ্যাডমিন করুন'}
            </button>
            
            <button 
              onClick={() => onDelete(member)}
              className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-red-50 text-red-600 text-sm font-medium hover:bg-red-100 transition"
            >
              <Trash2 size={14} /> নিষ্ক্রিয় করুন
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const SearchBar = ({ search, onSearchChange }) => (
  <div className="relative">
    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
    <input
      value={search}
      onChange={e => onSearchChange(e.target.value)}
      placeholder="নাম, ফোন, ইমেইল বা সদস্য আইডি দিয়ে খুঁজুন..."
      className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 outline-none transition"
    />
    {search && (
      <button 
        onClick={() => onSearchChange('')} 
        className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-slate-100 transition"
      >
        <X size={14} className="text-slate-400" />
      </button>
    )}
  </div>
);

const StatsCard = ({ title, value, icon: Icon, color }) => (
  <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs text-slate-500 mb-1">{title}</p>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
      </div>
      <div className={`w-10 h-10 rounded-xl bg-${color}-50 flex items-center justify-center`}>
        <Icon size={20} className={`text-${color}-500`} />
      </div>
    </div>
  </div>
);

// ==================== MAIN COMPONENT ====================

const AdminMembers = () => {
  const axios = useAxios();
  const queryClient = useQueryClient();
  
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [dueTarget, setDueTarget] = useState(null);
  const [filterRole, setFilterRole] = useState('all');

  // Queries
  const { data: members = [], isLoading, error } = useQuery({
    queryKey: ['admin-members'],
    queryFn: () => axios.get('/admin/members').then(res => res.data.members),
  });

  // Mutations
  const roleMutation = useMutation({
    mutationFn: ({ id, role }) => axios.patch(`/admin/members/${id}/role`, { role }),
    onSuccess: () => {
      toast.success('ভূমিকা পরিবর্তন সফল হয়েছে');
      queryClient.invalidateQueries(['admin-members']);
      setExpandedId(null);
    },
    onError: () => toast.error('পরিবর্তন ব্যর্থ হয়েছে'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => axios.delete(`/admin/members/${id}`),
    onSuccess: () => {
      toast.success('সদস্য নিষ্ক্রিয় করা হয়েছে');
      queryClient.invalidateQueries(['admin-members']);
      setExpandedId(null);
    },
    onError: () => toast.error('নিষ্ক্রিয় করতে ব্যর্থ হয়েছে'),
  });

  // Filtering logic
  const filteredMembers = useMemo(() => {
    let filtered = [...members];
    
    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(m => 
        m.name?.toLowerCase().includes(searchLower) ||
        m.phone?.includes(search) ||
        m.memberId?.includes(search) ||
        normalizeMemberId(m.memberId)?.includes(search) ||
        m.email?.toLowerCase().includes(searchLower)
      );
    }
    
    // Role filter
    if (filterRole !== 'all') {
      filtered = filtered.filter(m => m.role === filterRole);
    }
    
    return filtered;
  }, [members, search, filterRole]);

  // Stats
  const stats = {
    total: members.length,
    admins: members.filter(m => m.role === 'admin').length,
    members: members.filter(m => m.role === 'member').length,
    totalBalance: members.reduce((sum, m) => sum + (m.balance || 0), 0),
  };

  // Handlers
  const handleRoleChange = (member) => {
    const newRole = member.role === 'admin' ? 'member' : 'admin';
    const message = member.role === 'admin' 
      ? `${member.name}-কে সাধারণ সদস্য করবেন?`
      : `${member.name}-কে অ্যাডমিন করবেন?`;
    
    if (window.confirm(message)) {
      roleMutation.mutate({ id: member._id, role: newRole });
    }
  };

  const handleDelete = (member) => {
    if (window.confirm(`${member.name}-কে নিষ্ক্রিয় করবেন? এটি পূর্বাবস্থায় ফেরানো যাবে না।`)) {
      deleteMutation.mutate(member._id);
    }
  };

  const handleToggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <EmptyState message="ডাটা লোড করতে সমস্যা হয়েছে" />;

  return (
    <div className="min-h-screen bg-slate-50 pb-8">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800">সদস্য ব্যবস্থাপনা</h1>
          <p className="text-slate-500 mt-1">সকল সদস্যের তথ্য ও কার্যক্রম পরিচালনা করুন</p>
        </div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatsCard title="মোট সদস্য" value={stats.total} icon={Users} color="blue" />
          <StatsCard title="অ্যাডমিন" value={stats.admins} icon={Crown} color="amber" />
          <StatsCard title="সাধারণ সদস্য" value={stats.members} icon={Users} color="green" />
          <StatsCard title="মোট ব্যালেন্স" value={`৳${stats.totalBalance.toLocaleString()}`} icon={Shield} color="purple" />
        </div>
        
        {/* Search and Filter Bar */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <SearchBar search={search} onSearchChange={setSearch} />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setFilterRole('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  filterRole === 'all' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                সব
              </button>
              <button
                onClick={() => setFilterRole('admin')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  filterRole === 'admin' 
                    ? 'bg-amber-500 text-white' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Crown size={14} className="inline mr-1" /> অ্যাডমিন
              </button>
              <button
                onClick={() => setFilterRole('member')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  filterRole === 'member' 
                    ? 'bg-green-500 text-white' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Users size={14} className="inline mr-1" /> সদস্য
              </button>
            </div>
          </div>
        </div>
        
        {/* Members Grid */}
        {filteredMembers.length === 0 ? (
          <EmptyState message={search ? "খুঁজে পাওয়া যায়নি" : "কোনো সদস্য নেই"} />
        ) : (
          <>
            <div className="mb-4 flex justify-between items-center">
              <p className="text-sm text-slate-500">
                মোট {filteredMembers.length} জন সদস্য দেখানো হচ্ছে
              </p>
            </div>
            
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredMembers.map(member => (
                <MemberCard
                  key={member._id}
                  member={member}
                  isExpanded={expandedId === member._id}
                  onToggleExpand={() => handleToggleExpand(member._id)}
                  onDueReminder={setDueTarget}
                  onRoleChange={handleRoleChange}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </>
        )}
        
        {/* Loading states for mutations */}
        {(roleMutation.isPending || deleteMutation.isPending) && (
          <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-3 flex items-center gap-2">
            <Loader2 size={16} className="animate-spin text-blue-500" />
            <span className="text-sm text-slate-600">প্রক্রিয়াকরণ হচ্ছে...</span>
          </div>
        )}
      </div>
      
      {/* Modals */}
      {dueTarget && (
        <DueModal 
          member={dueTarget} 
          onClose={() => setDueTarget(null)} 
        />
      )}
    </div>
  );
};

export default AdminMembers;