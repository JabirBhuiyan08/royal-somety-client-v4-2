// client/src/pages/AdminNotifications.jsx
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import useAxios from '../hooks/useAxios';
import { 
  Bell, Send, Trash2, Info, AlertTriangle, CheckCircle, 
  AlertCircle, Mail, MessageSquare, Users, User, Search, 
  X, Filter, Eye, Calendar, Loader2, RefreshCw 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { normalizeMemberId } from '../utils/constants';

// ==================== CONSTANTS ====================

const NOTIFICATION_TYPES = {
  info: { 
    icon: Info, 
    color: '#2563eb', 
    bg: '#eff6ff', 
    border: '#bfdbfe',
    label: 'তথ্য',
    labelBn: 'তথ্য'
  },
  success: { 
    icon: CheckCircle, 
    color: '#16a34a', 
    bg: '#f0fdf4', 
    border: '#bbf7d0',
    label: 'সফলতা',
    labelBn: 'সফল'
  },
  warning: { 
    icon: AlertTriangle, 
    color: '#ea580c', 
    bg: '#fff7ed', 
    border: '#fed7aa',
    label: 'সতর্কতা',
    labelBn: 'সতর্ক'
  },
  alert: { 
    icon: AlertCircle, 
    color: '#dc2626', 
    bg: '#fef2f2', 
    border: '#fecaca',
    label: 'জরুরি',
    labelBn: 'জরুরি'
  },
};

// ==================== COMPONENTS ====================

const LoadingSpinner = () => (
  <div className="flex justify-center py-16">
    <Loader2 size={32} className="animate-spin text-blue-500" />
  </div>
);

const EmptyState = ({ icon: Icon, title, message }) => (
  <div className="text-center py-12 bg-white rounded-xl border border-slate-100">
    <Icon size={48} className="mx-auto text-slate-300 mb-3" />
    <p className="text-slate-600 font-medium mb-1">{title}</p>
    <p className="text-sm text-slate-400">{message}</p>
  </div>
);

const TypeSelector = ({ selectedType, onSelect }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {Object.entries(NOTIFICATION_TYPES).map(([key, { icon: Icon, color, bg, border, label }]) => (
        <button
          key={key}
          onClick={() => onSelect(key)}
          className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
            selectedType === key 
              ? 'shadow-md' 
              : 'hover:shadow-sm'
          }`}
          style={{
            background: selectedType === key ? bg : '#ffffff',
            borderColor: selectedType === key ? color : '#e2e8f0',
          }}
        >
          <Icon size={20} style={{ color: selectedType === key ? color : '#94a3b8' }} />
          <span 
            className="text-xs font-medium"
            style={{ color: selectedType === key ? color : '#64748b' }}
          >
            {label}
          </span>
        </button>
      ))}
    </div>
  );
};

const MemberSelector = ({ members, selectedMembers, onToggle, search, onSearchChange }) => {
  const filteredMembers = useMemo(() => {
    if (!search) return members;
    const searchLower = search.toLowerCase();
    return members.filter(m => 
      m.name?.toLowerCase().includes(searchLower) ||
      m.phone?.includes(search) ||
      m.memberId?.includes(search) ||
      normalizeMemberId(m.memberId)?.includes(search)
    );
  }, [members, search]);

  return (
    <div className="space-y-3">
      {/* Selected Members Tags */}
      {selectedMembers.length > 0 && (
        <div className="flex flex-wrap gap-2 p-3 bg-slate-50 rounded-xl">
          <span className="text-xs text-slate-500 font-medium mt-1">নির্বাচিত:</span>
          {selectedMembers.map(m => (
            <span
              key={m._id}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-blue-100 text-blue-700"
            >
              {m.name}
              <button onClick={() => onToggle(m)} className="hover:bg-blue-200 rounded-full p-0.5">
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search Input */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          placeholder="নাম, ফোন বা আইডি দিয়ে খুঁজুন..."
          className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition"
        />
        {search && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2"
          >
            <X size={12} className="text-slate-400" />
          </button>
        )}
      </div>

      {/* Members List */}
      <div className="max-h-64 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100">
        {filteredMembers.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-slate-400">কোনো সদস্য খুঁজে পাওয়া যায়নি</p>
          </div>
        ) : (
          filteredMembers.map(m => {
            const isSelected = selectedMembers.some(s => s._id === m._id);
            return (
              <button
                key={m._id}
                onClick={() => onToggle(m)}
                className={`w-full flex items-center gap-3 p-3 transition-colors ${
                  isSelected ? 'bg-blue-50' : 'hover:bg-slate-50'
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center flex-shrink-0">
                  {m.avatar ? (
                    <img src={m.avatar} className="w-full h-full object-cover rounded-full" alt={m.name} />
                  ) : (
                    <span className="text-sm font-bold text-blue-600">
                      {m.name?.[0]?.toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-slate-800">{m.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {m.phone && <p className="text-xs text-slate-500">{m.phone}</p>}
                    <p className="text-xs text-slate-400 font-mono">{normalizeMemberId(m.memberId)}</p>
                  </div>
                </div>
                {isSelected && <CheckCircle size={18} className="text-blue-600 flex-shrink-0" />}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

const NotificationCard = ({ notification, onDelete, isDeleting }) => {
  const config = NOTIFICATION_TYPES[notification.type] || NOTIFICATION_TYPES.info;
  const Icon = config.icon;
  const date = new Date(notification.createdAt);
  const formattedDate = date.toLocaleDateString('bn-BD', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="group bg-white rounded-xl border border-slate-100 hover:shadow-md transition-all duration-200">
      <div className="p-4 flex gap-3">
        {/* Icon */}
        <div 
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: config.bg }}
        >
          <Icon size={18} style={{ color: config.color }} />
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-slate-800">{notification.title}</h3>
              <span 
                className="inline-block text-xs px-2 py-0.5 rounded-full mt-1"
                style={{ background: config.bg, color: config.color }}
              >
                {config.label}
              </span>
            </div>
            <button
              onClick={() => onDelete(notification._id)}
              disabled={isDeleting}
              className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-50 transition-all disabled:opacity-50"
            >
              {isDeleting ? (
                <Loader2 size={14} className="animate-spin text-red-500" />
              ) : (
                <Trash2 size={14} className="text-red-400 hover:text-red-600" />
              )}
            </button>
          </div>
          
          <p className="text-sm text-slate-600 mt-2 leading-relaxed">{notification.message}</p>
          
          <div className="flex items-center gap-3 mt-3">
            <span className="flex items-center gap-1 text-xs text-slate-400">
              <Calendar size={12} /> {formattedDate}
            </span>
            {notification.targetUserIds?.length > 0 && (
              <span className="flex items-center gap-1 text-xs text-slate-400">
                <Users size={12} /> {notification.targetUserIds.length} জনকে পাঠানো
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== MAIN COMPONENT ====================

const AdminNotifications = () => {
  const axios = useAxios();
  const queryClient = useQueryClient();
  
  // Form state
  const [form, setForm] = useState({ 
    title: '', 
    message: '', 
    type: 'info' 
  });
  const [channels, setChannels] = useState({
    email: false,
    whatsapp: false,
  });
  const [targetMode, setTargetMode] = useState('all'); // 'all' or 'individual'
  const [memberSearch, setMemberSearch] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  
  // UI state
  const [deletingId, setDeletingId] = useState(null);

  // Queries
  const { data: notifications = [], isLoading, refetch } = useQuery({
    queryKey: ['admin-notifications'],
    queryFn: () => axios.get('/admin/notifications').then(r => r.data.notifications),
  });
  
  const { data: members = [] } = useQuery({
    queryKey: ['admin-members'],
    queryFn: () => axios.get('/admin/members').then(r => r.data.members),
  });

  // Mutations
  const sendMutation = useMutation({
    mutationFn: () => axios.post('/admin/notify', {
      title: form.title,
      message: form.message,
      type: form.type,
      targetUserIds: targetMode === 'individual' ? selectedMembers.map(m => m._id) : [],
      sendEmail: channels.email,
      sendWhatsApp: channels.whatsapp,
    }),
    onSuccess: () => {
      toast.success('নোটিফিকেশন পাঠানো হয়েছে');
      resetForm();
      queryClient.invalidateQueries(['admin-notifications']);
    },
    onError: (error) => {
      console.error(error);
      toast.error('পাঠানো ব্যর্থ হয়েছে');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => axios.delete(`/admin/notifications/${id}`),
    onSuccess: () => {
      toast.success('নোটিফিকেশন মুছে ফেলা হয়েছে');
      queryClient.invalidateQueries(['admin-notifications']);
      setDeletingId(null);
    },
    onError: () => {
      toast.error('মুছতে ব্যর্থ হয়েছে');
      setDeletingId(null);
    },
  });

  // Handlers
  const resetForm = () => {
    setForm({ title: '', message: '', type: 'info' });
    setChannels({ email: false, whatsapp: false });
    setTargetMode('all');
    setSelectedMembers([]);
    setMemberSearch('');
  };

  const handleToggleMember = (member) => {
    setSelectedMembers(prev =>
      prev.find(m => m._id === member._id)
        ? prev.filter(m => m._id !== member._id)
        : [...prev, member]
    );
  };

  const handleDeleteNotification = (id) => {
    if (window.confirm('এই নোটিফিকেশনটি মুছে ফেলতে চান?')) {
      setDeletingId(id);
      deleteMutation.mutate(id);
    }
  };

  const handleSendNotification = () => {
    if (!form.title.trim()) {
      toast.error('শিরোনাম লিখুন');
      return;
    }
    if (!form.message.trim()) {
      toast.error('বার্তা লিখুন');
      return;
    }
    if (targetMode === 'individual' && selectedMembers.length === 0) {
      toast.error('কমপক্ষে একজন সদস্য নির্বাচন করুন');
      return;
    }
    sendMutation.mutate();
  };

  const isSendDisabled = 
    !form.title.trim() || 
    !form.message.trim() || 
    sendMutation.isPending ||
    (targetMode === 'individual' && selectedMembers.length === 0);

  const getSendButtonText = () => {
    if (sendMutation.isPending) return 'পাঠানো হচ্ছে...';
    if (targetMode === 'all') return 'সকল সদস্যকে পাঠান';
    return `${selectedMembers.length} জন সদস্যকে পাঠান`;
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-8">
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800">নোটিফিকেশন</h1>
          <p className="text-slate-500 mt-1">সদস্যদের নোটিফিকেশন পাঠান ও ইতিহাস দেখুন</p>
        </div>

        {/* Send Notification Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 mb-6 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-white">
            <div className="flex items-center gap-2">
              <Bell size={20} className="text-blue-600" />
              <h2 className="text-lg font-semibold text-slate-800">নতুন নোটিফিকেশন পাঠান</h2>
            </div>
          </div>
          
          <div className="p-6 space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                শিরোনাম <span className="text-red-500">*</span>
              </label>
              <input
                value={form.title}
                onChange={e => setForm({...form, title: e.target.value})}
                placeholder="যেমন: মাসিক সভার আমন্ত্রণ"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition"
                maxLength="100"
              />
              <p className="text-xs text-slate-400 mt-1">{form.title.length}/100 অক্ষর</p>
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                বার্তা <span className="text-red-500">*</span>
              </label>
              <textarea
                value={form.message}
                onChange={e => setForm({...form, message: e.target.value})}
                placeholder="বিস্তারিত বার্তা লিখুন..."
                rows={4}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition resize-none"
                maxLength="500"
              />
              <p className="text-xs text-slate-400 mt-1">{form.message.length}/500 অক্ষর</p>
            </div>

            {/* Type Selector */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                নোটিফিকেশন টাইপ
              </label>
              <TypeSelector selectedType={form.type} onSelect={(type) => setForm({...form, type})} />
            </div>

            {/* Target Audience */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                পাঠানোর উদ্দেশ্য
              </label>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <button
                  onClick={() => setTargetMode('all')}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${
                    targetMode === 'all'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-slate-200 hover:border-slate-300 text-slate-600'
                  }`}
                >
                  <Users size={18} />
                  <span className="font-medium">সকল সদস্য</span>
                </button>
                <button
                  onClick={() => setTargetMode('individual')}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${
                    targetMode === 'individual'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-slate-200 hover:border-slate-300 text-slate-600'
                  }`}
                >
                  <User size={18} />
                  <span className="font-medium">নির্দিষ্ট সদস্য</span>
                </button>
              </div>

              {targetMode === 'individual' && (
                <MemberSelector
                  members={members}
                  selectedMembers={selectedMembers}
                  onToggle={handleToggleMember}
                  search={memberSearch}
                  onSearchChange={setMemberSearch}
                />
              )}
            </div>

            {/* Channels */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                পাঠানোর মাধ্যম
              </label>
              <div className="grid grid-cols-3 gap-3">
                <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-600">
                  <Bell size={16} />
                  <span className="text-sm font-medium">অ্যাপ</span>
                </div>
                <button
                  onClick={() => setChannels({...channels, email: !channels.email})}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${
                    channels.email
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-slate-200 hover:border-slate-300 text-slate-600'
                  }`}
                >
                  <Mail size={16} />
                  <span className="text-sm font-medium">ইমেইল</span>
                </button>
                <button
                  onClick={() => setChannels({...channels, whatsapp: !channels.whatsapp})}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${
                    channels.whatsapp
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-slate-200 hover:border-slate-300 text-slate-600'
                  }`}
                >
                  <MessageSquare size={16} />
                  <span className="text-sm font-medium">WhatsApp</span>
                </button>
              </div>
              <p className="text-xs text-slate-400 mt-2">
                ⚠️ অ্যাপ নোটিফিকেশন সবসময় পাঠানো হবে। ইমেইল ও WhatsApp শুধুমাত্র সেট করলে পাঠানো হবে।
              </p>
            </div>

            {/* Send Button */}
            <button
              onClick={handleSendNotification}
              disabled={isSendDisabled}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              <span className="flex items-center justify-center gap-2">
                {sendMutation.isPending ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Send size={18} />
                )}
                {getSendButtonText()}
              </span>
            </button>
          </div>
        </div>

        {/* Notifications History */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye size={20} className="text-slate-600" />
              <h2 className="text-lg font-semibold text-slate-800">পাঠানো নোটিফিকেশন</h2>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
                {notifications.length}
              </span>
            </div>
            <button
              onClick={() => refetch()}
              className="p-2 rounded-lg hover:bg-slate-100 transition"
            >
              <RefreshCw size={16} className="text-slate-500" />
            </button>
          </div>

          <div className="p-6">
            {isLoading ? (
              <LoadingSpinner />
            ) : notifications.length === 0 ? (
              <EmptyState
                icon={Bell}
                title="কোনো নোটিফিকেশন নেই"
                message="এখনও কোনো নোটিফিকেশন পাঠানো হয়নি"
              />
            ) : (
              <div className="space-y-3">
                {notifications.map(notification => (
                  <NotificationCard
                    key={notification._id}
                    notification={notification}
                    onDelete={handleDeleteNotification}
                    isDeleting={deletingId === notification._id}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminNotifications;