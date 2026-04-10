// client/src/pages/Home.jsx
import { useState, useRef } from 'react';
import { useAuth } from '../providers/AuthProvider';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import useAxios from '../hooks/useAxios';
import { useNavigate } from 'react-router-dom';
import { auth } from '../utils/firebase';
import {
  ChevronRight, Plus, Upload, X, AlertCircle,
  CheckCircle, Clock, Camera, ChevronLeft,
  Wallet, Calendar, Image as ImageIcon, CreditCard, Sparkles, Target
} from 'lucide-react';
import toast from 'react-hot-toast';

const BN_MONTHS = ['জানুয়ারি','ফেব্রুয়ারি','মার্চ','এপ্রিল','মে','জুন','জুলাই','আগস্ট','সেপ্টেম্বর','অক্টোবর','নভেম্বর','ডিসেম্বর'];

// Deposit Modal Component
const DepositModal = ({ onClose, preSelectedMonth }) => {
  const axios = useAxios();
  const qc = useQueryClient();
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [paymentMonth, setPaymentMonth] = useState(preSelectedMonth || '');
  const [selectedTarget, setSelectedTarget] = useState('');
  const [selectedAmountIndex, setSelectedAmountIndex] = useState(null);
  const now = new Date();

  const { data: targets = [] } = useQuery({
    queryKey: ['targets'],
    queryFn: () => axios.get('/member/targets').then(r => r.data.targets),
  });

  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const m = String(i + 1).padStart(2, '0');
    return { value: `${now.getFullYear()}-${m}`, label: BN_MONTHS[i] };
  });

  const mutation = useMutation({
    mutationFn: () => axios.post('/member/transactions/deposit', { 
      amount: Number(amount), 
      note, 
      paymentMonth,
      target: selectedTarget || null 
    }),
    onSuccess: () => {
      toast.success('জমার অনুরোধ পাঠানো হয়েছে');
      qc.invalidateQueries(['monthly-status']);
      qc.invalidateQueries(['transactions']);
      qc.invalidateQueries(['targets']);
      onClose();
    },
    onError: () => toast.error('অনুরোধ ব্যর্থ'),
  });

  return (
    <div className="fixed inset-0 z-50 mb-16 flex items-end justify-center bg-black/50" onClick={onClose}>
      <div className="w-full max-w-[480px] bg-white rounded-t-3xl shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-12 h-1 rounded-full bg-gray-300" />
        </div>
        
        <div className="px-5 pt-2 pb-4 border-b border-gray-100">
          <h3 className="text-xl font-bold text-gray-800">💰 টাকা জমার অনুরোধ</h3>
          <p className="text-sm text-gray-500 mt-1">আপনার অ্যাকাউন্টে টাকা যোগ করুন</p>
        </div>

        <div className="p-5 space-y-5">
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <Calendar size={16} className="text-blue-500" />
              মাস নির্বাচন করুন
            </label>
            <select 
              value={paymentMonth} 
              onChange={e => setPaymentMonth(e.target.value)} 
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 bg-gray-50 outline-none"
            >
              <option value="">মাস নির্বাচন করুন</option>
              {monthOptions.map(o => <option key={o.value} value={o.value}>{o.label} {now.getFullYear()}</option>)}
            </select>
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <CreditCard size={16} className="text-blue-500" />
              পরিমাণ (৳)
            </label>
            <div className="grid grid-cols-4 gap-2 mb-3">
              {[500,1000,2000,5000].map((amt, idx) => (
                <button 
                  key={amt} 
                  onClick={() => {
                    setAmount(String(amt));
                    setSelectedAmountIndex(idx);
                  }}
                  className={`py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95 ${
                    selectedAmountIndex === idx
                      ? 'bg-blue-500 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  ৳{amt}
                </button>
              ))}
            </div>
            <input 
              type="number" 
              value={amount} 
              onChange={e => {
                setAmount(e.target.value);
                setSelectedAmountIndex(null);
              }}
              placeholder="অথবা নিজের পরিমাণ লিখুন" 
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 bg-gray-50 outline-none"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <Sparkles size={16} className="text-blue-500" />
              নোট (ঐচ্ছিক)
            </label>
            <input 
              value={note} 
              onChange={e => setNote(e.target.value)} 
              placeholder="যেকোনো মন্তব্য লিখুন..." 
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 bg-gray-50 outline-none"
            />
          </div>

          {targets.length > 0 && (
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <Target size={16} className="text-blue-500" />
                লক্ষ্য (ঐচ্ছিক)
              </label>
              <select 
                value={selectedTarget}
                onChange={e => setSelectedTarget(e.target.value)}
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
            disabled={!amount || mutation.isPending} 
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-98"
          >
            {mutation.isPending ? 'পাঠানো হচ্ছে...' : 'অনুরোধ পাঠান'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Quick Stats Component
const QuickStats = ({ monthlyData }) => {
  if (!monthlyData) return null;
  
  const paidCount = Object.values(monthlyData.months).filter(v => v.status === 'approved').length;
  const pendingCount = Object.values(monthlyData.months).filter(v => v.status === 'pending').length;
  const dueCount = Object.values(monthlyData.months).filter(v => 
    v.status === 'unpaid' && new Date(`${v.month}-01`) <= new Date()
  ).length;

  return (
    <div className="grid grid-cols-3 gap-2">
      <div className="bg-white rounded-2xl p-3 text-center shadow-sm border border-gray-100">
        <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-100 mb-2">
          <CheckCircle size={14} className="text-green-600" />
        </div>
        <p className="text-lg font-bold text-gray-800">{paidCount}/12</p>
        <p className="text-xs text-gray-500">পরিশোধিত</p>
      </div>
      <div className="bg-white rounded-2xl p-3 text-center shadow-sm border border-gray-100">
        <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-orange-100 mb-2">
          <Clock size={14} className="text-orange-600" />
        </div>
        <p className="text-lg font-bold text-gray-800">{pendingCount}</p>
        <p className="text-xs text-gray-500">অপেক্ষমাণ</p>
      </div>
      <div className="bg-white rounded-2xl p-3 text-center shadow-sm border border-gray-100">
        <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-100 mb-2">
          <AlertCircle size={14} className="text-red-600" />
        </div>
        <p className="text-lg font-bold text-gray-800">{dueCount}</p>
        <p className="text-xs text-gray-500">বকেয়া</p>
      </div>
    </div>
  );
};

// Due Alert Component
const DueAlert = ({ monthlyData, onRequestPay }) => {
  if (!monthlyData) return null;
  const unpaid = Object.entries(monthlyData.months).filter(([key, info]) => {
    return info.status === 'unpaid' && new Date(`${key}-01`) <= new Date();
  });
  if (unpaid.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-red-100" style={{ background: '#fef2f2' }}>
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
          <AlertCircle size={18} className="text-red-600" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-red-700">
            ⚠️ {unpaid.length}টি মাসের বকেয়া রয়েছে
          </p>
          <p className="text-xs text-red-500 mt-1">
            {unpaid.map(([k]) => BN_MONTHS[parseInt(k.split('-')[1]) - 1]).join(', ')}
          </p>
          <button 
            onClick={() => onRequestPay(unpaid[0][0])}
            className="mt-3 px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-red-500 hover:bg-red-600 transition-all active:scale-95"
          >
            এখনই পরিশোধ করুন
          </button>
        </div>
      </div>
    </div>
  );
};

// Monthly Grid Component
// Simplified Monthly Grid Component
const MonthlyGrid = ({ monthlyData, onRequestPay }) => {
  if (!monthlyData) return null;
  const entries = Object.entries(monthlyData.months);
  const paidCount = entries.filter(([_, info]) => info.status === 'approved').length;

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-bold text-gray-800">মাসিক পেমেন্ট {monthlyData.year}</p>
        <span className="text-sm font-bold text-green-600">{paidCount}/12</span>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-1.5 mb-4">
        <div 
          className="bg-green-500 h-1.5 rounded-full transition-all"
          style={{ width: `${(paidCount / 12) * 100}%` }}
        />
      </div>

      <div className="grid grid-cols-3 gap-1.5 mb-4">
        {entries.map(([key, info], idx) => {
          const monthName = BN_MONTHS[idx];
          const isPaid = info.status === 'approved';
          const isPending = info.status === 'pending';
          const isUnpaid = info.status === 'unpaid';
          const isFuture = new Date(`${key}-01`) > new Date();
          
          let bg = 'bg-gray-50';
          let text = 'text-gray-400';
          let icon = '○';
          
          if (isPaid) {
            bg = 'bg-green-100';
            text = 'text-green-700';
            icon = '✓';
          } else if (isPending) {
            bg = 'bg-yellow-100';
            text = 'text-yellow-700';
            icon = '⏳';
          } else if (isUnpaid && !isFuture) {
            bg = 'bg-red-100';
            text = 'text-red-700';
            icon = '!';
          }
          
          return (
            <button 
              key={key}
              onClick={isUnpaid && !isFuture ? () => onRequestPay(key) : undefined}
              disabled={isPaid || isPending || isFuture}
              className={`py-2 rounded-xl text-center ${bg} ${text} font-medium text-sm transition-all ${!isFuture && isUnpaid ? 'active:scale-95 cursor-pointer' : 'cursor-default'}`}
            >
              <div>{icon}</div>
              <div className="text-xs">{monthName}</div>
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-center gap-3 pt-2 border-t border-gray-100">
        <div className="flex items-center gap-1">
          <div className="w-5 h-5 rounded bg-green-100 flex items-center justify-center text-xs text-green-700">✓</div>
          <span className="text-xs text-gray-600">পরিশোধিত</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-5 h-5 rounded bg-yellow-100 flex items-center justify-center text-xs text-yellow-700">⏳</div>
          <span className="text-xs text-gray-600">অপেক্ষমাণ</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-5 h-5 rounded bg-red-100 flex items-center justify-center text-xs text-red-700">!</div>
          <span className="text-xs text-gray-600">বকেয়া</span>
        </div>
      </div>
    </div>
  );
};

// Simplified Gallery Component
const GalleryStrip = ({ photos, uploading, fileRef, onFileChange, onOpen }) => (
  <div className="bg-white rounded-2xl p-4 shadow-sm">
    <div className="flex items-center justify-between mb-3">
      <p className="text-sm font-bold text-gray-800">গ্যালারি</p>
      <button 
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        className="px-3 py-1.5 rounded-lg text-xs font-medium text-purple-600 bg-purple-50 active:scale-95 transition-all"
      >
        {uploading ? 'আপলোড...' : '+ ছবি যোগ করুন'}
      </button>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
    </div>
    
    {photos.length === 0 ? (
      <button 
        onClick={() => fileRef.current?.click()}
        className="w-full py-8 rounded-xl bg-gray-50 border-2 border-dashed border-gray-200 text-center active:scale-95 transition-all"
      >
        <Upload size={24} className="text-gray-400 mx-auto mb-2" />
        <span className="text-sm text-gray-500">প্রথম ছবি যোগ করুন</span>
      </button>
    ) : (
      <div className="grid grid-cols-3 gap-2">
        {photos.slice(0, 5).map((photo, idx) => (
          <button 
            key={photo._id} 
            onClick={() => onOpen(idx)}
            className="aspect-square rounded-xl overflow-hidden active:scale-95 transition-all"
          >
            <img src={photo.url} alt="" className="w-full h-full object-cover" />
          </button>
        ))}
        <button 
          onClick={() => fileRef.current?.click()}
          className="aspect-square rounded-xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center active:scale-95 transition-all"
        >
          <Plus size={24} className="text-gray-400" />
        </button>
      </div>
    )}
  </div>
);

// Main Home Component
const Home = () => {
  const { dbUser } = useAuth();
  const axios = useAxios();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const fileRef = useRef(null);

  const [showDeposit, setShowDeposit] = useState(false);
  const [preSelectedMonth, setPreSelectedMonth] = useState('');
  const [uploading, setUploading] = useState(false);
  const [lightbox, setLightbox] = useState(null);
  const [lightboxIdx, setLightboxIdx] = useState(0);

  const getPhoneFromEmail = () => {
    const email = auth.currentUser?.email;
    if (!email) return '';
    return email.split('@')[0].replace(/^\+88/, '0');
  };

  const { data: monthlyData } = useQuery({
    queryKey: ['monthly-status'],
    queryFn: () => axios.get('/member/monthly-status').then(r => r.data),
    enabled: !!dbUser,
  });

  const { data: photos = [] } = useQuery({
    queryKey: ['gallery'],
    queryFn: () => axios.get('/member/gallery').then(r => r.data.photos),
  });

  const openPay = (monthKey) => { 
    setPreSelectedMonth(monthKey); 
    setShowDeposit(true); 
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0]; 
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData(); 
      fd.append('photo', file);
      await axios.post('/member/gallery', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('ছবি আপলোড হয়েছে 📸');
      qc.invalidateQueries(['gallery']);
    } catch { 
      toast.error('আপলোড ব্যর্থ'); 
    } finally { 
      setUploading(false); 
      e.target.value = ''; 
    }
  };

  const openLightbox = (idx) => { 
    setLightboxIdx(idx); 
    setLightbox(photos[idx]); 
  };
  
  const navLight = (dir) => {
    const i = (lightboxIdx + dir + photos.length) % photos.length;
    setLightboxIdx(i); 
    setLightbox(photos[i]);
  };

  const unpaidCount = monthlyData
    ? Object.entries(monthlyData.months).filter(([k, v]) => v.status === 'unpaid' && new Date(`${k}-01`) <= new Date()).length
    : 0;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Profile Header */}
      <div className="relative mb-3">
        <div className="h-28 bg-gradient-to-r from-blue-500 to-indigo-600 relative overflow-hidden">
          {dbUser?.coverPhoto && (
            <img src={dbUser.coverPhoto} alt="" className="w-full h-full object-cover" />
          )}
        </div>

        <div className="mx-3 -mt-12">
          <div className="bg-white rounded-2xl pt-14 pb-3 px-3 shadow-lg border border-gray-100">
            <div className="flex items-end gap-3">
              <div className="relative">
                <div className="w-16 h-16 rounded-xl overflow-hidden ring-4 ring-white shadow-md bg-gradient-to-br from-blue-100 to-indigo-100">
                  {dbUser?.avatar ? (
                    <img src={dbUser.avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl font-bold bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                      {dbUser?.name?.[0] || '?'}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <h2 className="font-bold text-gray-800 text-base truncate">
                  {dbUser?.name || '...'}
                </h2>
                <p className="text-xs text-blue-600 font-medium">{getPhoneFromEmail()}</p>
                <p className="text-xs text-gray-500 font-mono">ID: {dbUser?.memberId || '—'}</p>
                <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                  {dbUser?.role === 'admin' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
                      👑 অ্যাডমিন
                    </span>
                  )}
                  {unpaidCount > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                      ⚠ {unpaidCount}টি বকেয়া
                    </span>
                  )}
                  {unpaidCount === 0 && monthlyData && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                      ✓ আপডেটেড
                    </span>
                  )}
                </div>
              </div>
              
              <button 
                onClick={() => navigate('/profile')}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 text-xs font-semibold hover:bg-gray-200 transition-all active:scale-95 flex-shrink-0"
              >
                প্রোফাইল <ChevronRight size={12} />
              </button>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-0.5 flex items-center gap-1">
                  <Wallet size={12} /> মোট ব্যালেন্স
                </p>
                <p className="text-xl font-bold text-gray-800">৳{(dbUser?.balance || 0).toLocaleString()}</p>
              </div>
              <button 
                onClick={() => setShowDeposit(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-bold shadow-md hover:bg-blue-700 transition-all active:scale-95"
              >
                <Plus size={14} /> টাকা জমা
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-3 space-y-3 pb-24">
        <QuickStats monthlyData={monthlyData} />
        <DueAlert monthlyData={monthlyData} onRequestPay={openPay} />
        <MonthlyGrid monthlyData={monthlyData} onRequestPay={openPay} />
      </div>

      {/* Deposit Modal */}
      {showDeposit && <DepositModal onClose={() => setShowDeposit(false)} preSelectedMonth={preSelectedMonth} />}

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center" onClick={() => setLightbox(null)}>
          <button 
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all active:scale-95"
            onClick={() => setLightbox(null)}
          >
            <X size={20} className="text-white" />
          </button>
          <button 
            className="absolute left-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all active:scale-95"
            onClick={e => { e.stopPropagation(); navLight(-1); }}
          >
            <ChevronLeft size={20} className="text-white" />
          </button>
          <div className="px-12 max-w-full" onClick={e => e.stopPropagation()}>
            <img src={lightbox.url} alt="" className="max-h-[70vh] max-w-full rounded-xl object-contain" />
            <p className="text-center text-white/40 mt-2 text-xs">
              {lightboxIdx + 1} / {photos.length}
            </p>
          </div>
          <button 
            className="absolute right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all active:scale-95"
            onClick={e => { e.stopPropagation(); navLight(1); }}
          >
            <ChevronRight size={20} className="text-white" />
          </button>
        </div>
      )}
    </div>
  );
};

export default Home;