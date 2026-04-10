// client/src/pages/Emergency.jsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import useAxios from '../hooks/useAxios';
import { Search, Phone, Heart, Users } from 'lucide-react';
import { BLOOD_GROUPS } from '../utils/constants';
import { useAuth } from '../providers/AuthProvider';

const bloodColors = {
  'A+':'#dc2626','A-':'#ea580c','B+':'#9333ea','B-':'#7c3aed',
  'AB+':'#2563eb','AB-':'#0891b2','O+':'#16a34a','O-':'#ca8a04',
};

const Emergency = () => {
  const axios = useAxios();
  const { dbUser } = useAuth();
  const [search, setSearch] = useState('');
  const [filterBlood, setFilterBlood] = useState('');

  const { data: members = [], isLoading } = useQuery({
    queryKey: ['emergency-members'],
    queryFn: () => axios.get('/member/emergency-list').then(r => r.data.members),
  });

  const filtered = members.filter(m => {
    const q = search.toLowerCase();
    return (!search || m.name?.toLowerCase().includes(q) || m.phone?.includes(search) || m.memberId?.includes(search))
      && (!filterBlood || m.bloodGroup === filterBlood);
  });

  return (
    <div className="px-4 py-4 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
          <Heart size={20} className="text-red-600" />
        </div>
        <div className="flex-1">
          <h2 className="text-base font-bold text-gray-800">জরুরি যোগাযোগ</h2>
          <p className="text-xs text-gray-500">সদস্যদের সাথে সরাসরি যোগাযোগ করুন</p>
        </div>
        <div className="flex items-center gap-2">
          {dbUser?.memberId && (
            <span className="text-xs text-gray-400 font-mono">{dbUser.memberId}</span>
          )}
          {dbUser?.bloodGroup && (
            <div className="px-3 py-1.5 rounded-lg bg-red-100 text-red-600 text-sm font-bold">
              🩸 {dbUser.bloodGroup}
            </div>
          )}
        </div>
      </div>

      {/* Search Input */}
      <div className="relative mb-3">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input 
          value={search} 
          onChange={e => setSearch(e.target.value)}
          placeholder="নাম, ফোন বা আইডি দিয়ে খুঁজুন..."
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
        />
      </div>

      {/* Blood Group Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
        <button 
          onClick={() => setFilterBlood('')}
          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95 ${
            !filterBlood 
              ? 'bg-blue-600 text-white shadow-md' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          সব গ্রুপ
        </button>
        {BLOOD_GROUPS.map(bg => {
          const c = bloodColors[bg];
          return (
            <button 
              key={bg} 
              onClick={() => setFilterBlood(bg === filterBlood ? '' : bg)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 ${
                filterBlood === bg 
                  ? 'text-white shadow-md' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              style={filterBlood === bg ? { backgroundColor: c } : {}}
            >
              {bg}
            </button>
          );
        })}
      </div>

      {/* Member Count */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-gray-500">{filtered.length} জন সদস্য</p>
        <Users size={14} className="text-gray-400" />
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        /* Empty State */
        <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="text-5xl mb-3">🔍</div>
          <p className="text-gray-400 text-sm">কোনো সদস্য পাওয়া যায়নি</p>
        </div>
      ) : (
        /* Members List */
        <div className="space-y-2">
          {filtered.map(m => {
            const c = bloodColors[m.bloodGroup] || '#2563eb';
            return (
              <div key={m._id} className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 flex items-center gap-3">
                {/* Avatar */}
                <div 
                  className="w-11 h-11 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center font-bold text-base"
                  style={{ 
                    backgroundColor: c + '18', 
                    color: c,
                    border: `1.5px solid ${c}30`
                  }}
                >
                  {m.avatar ? (
                    <img src={m.avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    m.name?.[0]
                  )}
                </div>
                
                {/* Member Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{m.name}</p>
                  <p className="text-xs text-gray-500 font-mono">{m.phone}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {m.bloodGroup && (
                      <span 
                        className="text-xs font-semibold px-1.5 py-0.5 rounded"
                        style={{ backgroundColor: c + '18', color: c }}
                      >
                        🩸 {m.bloodGroup}
                      </span>
                    )}
                    <span className="text-xs text-gray-400 font-mono">{m.memberId}</span>
                  </div>
                </div>
                
                {/* Call Button */}
                <a
                  href={`tel:${m.phone}`}
                  className="w-10 h-10 rounded-xl bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center flex-shrink-0 hover:from-green-600 hover:to-green-700 active:scale-95 transition-all shadow-md"
                >
                  <Phone size={16} className="text-white" />
                </a>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Emergency;