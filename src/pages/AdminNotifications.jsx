// client/src/pages/AdminNotifications.jsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import useAxios from '../hooks/useAxios';
import { Bell, Send, Trash2, Info, AlertTriangle, CheckCircle, AlertCircle, Mail, MessageSquare, Users, User, Search, X } from 'lucide-react';
import toast from 'react-hot-toast';

const typeConfig = {
  info:    { icon: Info,          color: '#2563eb', bg: '#eff6ff', label: 'তথ্য' },
  success: { icon: CheckCircle,   color: '#16a34a', bg: '#f0fdf4', label: 'সফলতা' },
  warning: { icon: AlertTriangle, color: '#ea580c', bg: '#fff7ed', label: 'সতর্কতা' },
  alert:   { icon: AlertCircle,   color: '#dc2626', bg: '#fef2f2', label: 'জরুরি' },
};

const AdminNotifications = () => {
  const axios = useAxios();
  const qc = useQueryClient();
  const [form, setForm] = useState({ title: '', message: '', type: 'info' });
  const [sendEmail, setSendEmail] = useState(false);
  const [sendWhatsApp, setSendWhatsApp] = useState(false);
  const [targetMode, setTargetMode] = useState('all');
  const [memberSearch, setMemberSearch] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['admin-notifications'],
    queryFn: () => axios.get('/admin/notifications').then(r => r.data.notifications),
  });
  const { data: members = [] } = useQuery({
    queryKey: ['admin-members'],
    queryFn: () => axios.get('/admin/members').then(r => r.data.members),
  });

  const filtered = members.filter(m => m.name?.toLowerCase().includes(memberSearch.toLowerCase()) || m.phone?.includes(memberSearch));
  const toggle = (m) => setSelectedMembers(p => p.find(x => x._id === m._id) ? p.filter(x => x._id !== m._id) : [...p, m]);

  const sendMut = useMutation({
    mutationFn: () => axios.post('/admin/notify', {
      title: form.title, message: form.message, type: form.type,
      targetUserIds: targetMode === 'individual' ? selectedMembers.map(m => m._id) : [],
      sendEmail, sendWhatsApp,
    }),
    onSuccess: () => { toast.success('নোটিফিকেশন পাঠানো হয়েছে'); setForm({ title: '', message: '', type: 'info' }); setSelectedMembers([]); qc.invalidateQueries(['admin-notifications']); },
    onError: () => toast.error('পাঠানো ব্যর্থ'),
  });

  const delMut = useMutation({
    mutationFn: (id) => axios.delete(`/admin/notifications/${id}`),
    onSuccess: () => { qc.invalidateQueries(['admin-notifications']); toast.success('মুছে ফেলা হয়েছে'); },
  });

  return (
    <div className="px-4 py-4 page-enter pb-5">
      <h2 className="text-base font-bold text-slate-800 mb-4" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>নোটিফিকেশন পাঠান</h2>

      <div className="card p-4 mb-5">
        <p className="text-sm font-bold text-slate-700 mb-3" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>নতুন নোটিফিকেশন</p>
        <div className="space-y-3">
          <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="শিরোনাম" className="input-field" />
          <textarea value={form.message} onChange={e => setForm({...form, message: e.target.value})} placeholder="বার্তা..." rows={3} className="input-field resize-none" />

          {/* Type */}
          <div className="flex gap-2">
            {Object.entries(typeConfig).map(([key, { icon: Icon, color, bg, label }]) => (
              <button key={key} onClick={() => setForm({...form, type: key})}
                className="flex-1 flex flex-col items-center gap-1 py-2 rounded-xl border text-xs font-semibold transition-all"
                style={form.type === key ? { background: bg, borderColor: color, color } : { background: '#f8fafc', borderColor: '#e2e8f0', color: '#94a3b8' }}>
                <Icon size={13} /><span style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>{label}</span>
              </button>
            ))}
          </div>

          {/* Target */}
          <div className="flex gap-2">
            {[{ key: 'all', icon: Users, label: 'সকল সদস্য' }, { key: 'individual', icon: User, label: 'নির্দিষ্ট সদস্য' }].map(({ key, icon: Icon, label }) => (
              <button key={key} onClick={() => setTargetMode(key)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm border font-semibold transition-all"
                style={targetMode === key ? { background: '#eff6ff', borderColor: '#bfdbfe', color: '#2563eb' } : { background: '#f8fafc', borderColor: '#e2e8f0', color: '#94a3b8' }}>
                <Icon size={13} /><span style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>{label}</span>
              </button>
            ))}
          </div>

          {/* Individual picker */}
          {targetMode === 'individual' && (
            <div>
              <div className="relative mb-2">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
                <input value={memberSearch} onChange={e => setMemberSearch(e.target.value)} placeholder="সদস্য খুঁজুন..." className="input-field pl-8 text-xs" />
              </div>
              {selectedMembers.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {selectedMembers.map(m => (
                    <span key={m._id} className="flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-blue-50 text-blue-700 border border-blue-200">
                      {m.name}<button onClick={() => toggle(m)}><X size={10} /></button>
                    </span>
                  ))}
                </div>
              )}
              <div className="max-h-40 overflow-y-auto space-y-1 rounded-xl border border-slate-100 p-2 bg-slate-50">
                {filtered.map(m => {
                  const sel = selectedMembers.find(x => x._id === m._id);
                  return (
                    <button key={m._id} onClick={() => toggle(m)}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors"
                      style={sel ? { background: '#eff6ff' } : { background: '#fff' }}>
                      <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {m.avatar ? <img src={m.avatar} className="w-full h-full object-cover rounded-full" /> : m.name?.[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-700 truncate" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>{m.name}</p>
                        <p className="text-xs text-slate-400 font-mono">{m.phone || m.memberId}</p>
                      </div>
                      {sel && <CheckCircle size={13} className="text-blue-600" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Channels */}
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-2" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>পাঠানোর মাধ্যম</p>
            <div className="flex gap-2">
              <div className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 text-xs font-semibold">
                <Bell size={12} /><span style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>অ্যাপ</span>
              </div>
              {[{ key: 'email', icon: Mail, label: 'ইমেইল', state: sendEmail, set: setSendEmail },
                { key: 'wa', icon: MessageSquare, label: 'WhatsApp', state: sendWhatsApp, set: setSendWhatsApp }].map(({ key, icon: Icon, label, state, set }) => (
                <button key={key} onClick={() => set(!state)}
                  className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-semibold border transition-all"
                  style={state ? { background: '#f0fdf4', borderColor: '#bbf7d0', color: '#16a34a' } : { background: '#f8fafc', borderColor: '#e2e8f0', color: '#94a3b8' }}>
                  <Icon size={12} /><span style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>{label}</span>
                </button>
              ))}
            </div>
          </div>

          <button onClick={() => sendMut.mutate()}
            disabled={!form.title || !form.message || sendMut.isPending || (targetMode === 'individual' && !selectedMembers.length)}
            className="btn-primary">
            <span className="flex items-center justify-center gap-2">
              <Send size={14} />
              {sendMut.isPending ? 'পাঠানো হচ্ছে...' : targetMode === 'all' ? 'সকলকে পাঠান' : `${selectedMembers.length} জনকে পাঠান`}
            </span>
          </button>
        </div>
      </div>

      {/* History */}
      <p className="section-title mb-3">পাঠানো নোটিফিকেশন</p>
      {isLoading ? <div className="flex justify-center py-6"><div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
      : notifications.length === 0 ? <div className="text-center py-8"><div className="text-4xl mb-2">🔔</div><p className="text-slate-400 text-sm" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>কোনো নোটিফিকেশন নেই</p></div>
      : (
        <div className="space-y-2">
          {notifications.map(n => {
            const cfg = typeConfig[n.type] || typeConfig.info;
            const Icon = cfg.icon;
            return (
              <div key={n._id} className="card-sm p-3 flex gap-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: cfg.bg }}>
                  <Icon size={14} style={{ color: cfg.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-800 truncate" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>{n.title}</p>
                  <p className="text-xs text-slate-400 line-clamp-2 mt-0.5" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>{n.message}</p>
                  <p className="text-xs text-slate-300 mt-1">{new Date(n.createdAt).toLocaleString('bn-BD')}</p>
                </div>
                <button onClick={() => delMut.mutate(n._id)} className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
                  <Trash2 size={12} className="text-red-400" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminNotifications;
