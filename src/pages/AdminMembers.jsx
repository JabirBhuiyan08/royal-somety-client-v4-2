// client/src/pages/AdminMembers.jsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import useAxios from '../hooks/useAxios';
import { Search, Users, Crown, Trash2, Shield, Bell, ChevronDown, ChevronUp, Phone } from 'lucide-react';
import toast from 'react-hot-toast';

const DueModal = ({ member, onClose, axios, qc }) => {
  const [amount, setAmount] = useState('');
  const mut = useMutation({
    mutationFn: () => axios.post('/admin/transactions/due-reminder', { userId: member._id, dueAmount: Number(amount) }),
    onSuccess: () => { toast.success('রিমাইন্ডার পাঠানো হয়েছে'); onClose(); },
    onError: () => toast.error('পাঠানো ব্যর্থ'),
  });
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end justify-center" onClick={onClose}>
      <div className="w-full max-w-[480px] bg-white rounded-t-2xl p-5 pb-8" onClick={e => e.stopPropagation()}>
        <div className="w-10 h-1 rounded-full bg-slate-200 mx-auto mb-4" />
        <p className="font-bold text-slate-800 mb-4" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>বকেয়া রিমাইন্ডার — {member.name}</p>
        <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="বকেয়া পরিমাণ (৳)" className="input-field mb-3" />
        <div className="p-3 rounded-xl bg-orange-50 border border-orange-200 mb-3">
          <p className="text-xs text-orange-600" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>⚠️ অ্যাপ নোটিফিকেশন, ইমেইল ও WhatsApp পাঠানো হবে।</p>
        </div>
        <button onClick={() => mut.mutate()} disabled={!amount || mut.isPending} className="btn-primary" style={{ background: '#ea580c' }}>
          {mut.isPending ? 'পাঠানো হচ্ছে...' : 'রিমাইন্ডার পাঠান'}
        </button>
      </div>
    </div>
  );
};

const AdminMembers = () => {
  const axios = useAxios();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [dueTarget, setDueTarget] = useState(null);

  const { data: members = [], isLoading } = useQuery({
    queryKey: ['admin-members'],
    queryFn: () => axios.get('/admin/members').then(r => r.data.members),
  });

  const roleMut = useMutation({
    mutationFn: ({ id, role }) => axios.patch(`/admin/members/${id}/role`, { role }),
    onSuccess: () => { toast.success('ভূমিকা পরিবর্তন সফল'); qc.invalidateQueries(['admin-members']); },
    onError: () => toast.error('পরিবর্তন ব্যর্থ'),
  });
  const delMut = useMutation({
    mutationFn: (id) => axios.delete(`/admin/members/${id}`),
    onSuccess: () => { toast.success('সদস্য নিষ্ক্রিয়'); qc.invalidateQueries(['admin-members']); },
  });

  const filtered = members.filter(m =>
    m.name?.toLowerCase().includes(search.toLowerCase()) || m.phone?.includes(search) || m.memberId?.includes(search)
  );

  return (
    <div className="px-4 py-4 page-enter pb-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users size={18} className="text-slate-600" />
          <h2 className="text-base font-bold text-slate-800" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>সদস্য ব্যবস্থাপনা</h2>
        </div>
        <span className="badge badge-gray">{members.length} জন</span>
      </div>

      <div className="relative mb-4">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="নাম, ফোন বা আইডি দিয়ে খুঁজুন..."
          className="input-field pl-10" />
      </div>

      {isLoading ? <div className="flex justify-center py-16"><div className="w-7 h-7 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
      : (
        <div className="space-y-2">
          {filtered.map(m => {
            const isExp = expanded === m._id;
            return (
              <div key={m._id} className="card overflow-hidden">
                <div className="p-4 flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl overflow-hidden flex-shrink-0 bg-slate-100 flex items-center justify-center font-bold text-slate-500"
                    style={{ border: m.role === 'admin' ? '2px solid #2563eb' : 'none' }}>
                    {m.avatar ? <img src={m.avatar} className="w-full h-full object-cover" /> : m.name?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-bold text-slate-800 truncate" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>{m.name}</p>
                      {m.role === 'admin' && <Crown size={12} className="text-blue-600" />}
                    </div>
                    <p className="text-xs text-slate-400 font-mono">{m.phone || '—'}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-slate-400">{m.memberId}</span>
                      <span className="text-xs font-bold text-green-600">৳{(m.balance||0).toLocaleString()}</span>
                      {m.bloodGroup && <span className="badge badge-red" style={{ fontSize: 10 }}>🩸{m.bloodGroup}</span>}
                    </div>
                  </div>
                  <button onClick={() => setExpanded(isExp ? null : m._id)} className="p-2 rounded-lg bg-slate-50">
                    {isExp ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
                  </button>
                </div>

                {isExp && (
                  <div className="px-4 pb-4 grid grid-cols-2 gap-2 border-t border-slate-50">
                    {m.phone && (
                      <a href={`tel:${m.phone}`} className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-green-50 border border-green-200 text-green-700 text-xs font-semibold">
                        <Phone size={13} /><span style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>কল করুন</span>
                      </a>
                    )}
                    <button onClick={() => setDueTarget(m)}
                      className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-orange-50 border border-orange-200 text-orange-700 text-xs font-semibold">
                      <Bell size={13} /><span style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>বকেয়া রিমাইন্ডার</span>
                    </button>
                    <button onClick={() => roleMut.mutate({ id: m._id, role: m.role === 'admin' ? 'member' : 'admin' })}
                      className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold"
                      style={m.role === 'admin' ? { background: '#eff6ff', border: '1px solid #bfdbfe', color: '#2563eb' } : { background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b' }}>
                      {m.role === 'admin' ? <Crown size={13} /> : <Shield size={13} />}
                      <span style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>{m.role === 'admin' ? 'অ্যাডমিন সরান' : 'অ্যাডমিন করুন'}</span>
                    </button>
                    <button onClick={() => window.confirm(`${m.name}-কে নিষ্ক্রিয় করবেন?`) && delMut.mutate(m._id)}
                      className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-semibold">
                      <Trash2 size={13} /><span style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>নিষ্ক্রিয় করুন</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {dueTarget && <DueModal member={dueTarget} onClose={() => setDueTarget(null)} axios={axios} qc={qc} />}
    </div>
  );
};

export default AdminMembers;
