// client/src/pages/Profile.jsx
import { useState, useRef } from 'react';
import { useAuth } from '../providers/AuthProvider';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Camera, Copy, CheckCircle, Phone, Droplets, Calendar, Edit2, LogOut, Save, X, Wallet, Users, TrendingUp, Lock, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useAxios from '../hooks/useAxios';
import toast from 'react-hot-toast';
import { BLOOD_GROUPS } from '../utils/constants';
import { auth } from '../utils/firebase';
import { signInWithEmailAndPassword, updatePassword } from 'firebase/auth';

const Profile = () => {
  const { dbUser, logout, isAdmin, setDbUser } = useAuth();
  const [copied, setCopied] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({});
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [changePinMode, setChangePinMode] = useState(false);
  const [pinForm, setPinForm] = useState({ phone: '', previousPin: '', newPin: '', confirmPin: '' });
  const [showPins, setShowPins] = useState({ previousPin: false, newPin: false, confirmPin: false });
  const [changingPin, setChangingPin] = useState(false);
  const navigate = useNavigate();
  const axios = useAxios();
  const avatarRef = useRef(null);
  const coverRef = useRef(null);

  const { data: totalBalanceData } = useQuery({
    queryKey: ['total-balance'],
    queryFn: () => axios.get('/member/total-balance').then(r => r.data),
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => axios.get('/admin/stats').then(r => r.data),
    enabled: isAdmin,
  });

  const openEdit = () => { 
    setForm({ name: dbUser?.name || '', phone: dbUser?.phone || '', bloodGroup: dbUser?.bloodGroup || '' }); 
    setEditMode(true); 
  };

  const updateMutation = useMutation({
    mutationFn: () => {
      const fd = new FormData();
      if (form.name) fd.append('name', form.name);
      if (form.phone) fd.append('phone', form.phone);
      if (form.bloodGroup) fd.append('bloodGroup', form.bloodGroup);
      if (avatarFile) fd.append('avatar', avatarFile);
      if (coverFile) fd.append('cover', coverFile);
      return axios.patch('/member/profile', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    },
    onSuccess: (res) => { 
      setDbUser(res.data.user); 
      toast.success('প্রোফাইল আপডেট হয়েছে'); 
      setEditMode(false); 
      setAvatarFile(null); 
      setCoverFile(null); 
      setAvatarPreview(null); 
      setCoverPreview(null); 
    },
    onError: () => toast.error('আপডেট ব্যর্থ'),
  });

  const copyId = () => { 
    navigator.clipboard.writeText(dbUser?.memberId || ''); 
    setCopied(true); 
    setTimeout(() => setCopied(false), 2000); 
    toast.success('আইডি কপি হয়েছে'); 
  };

  const formatPhoneAsEmail = (value) => {
    if (!value) return '';
    const digits = value.replace(/\D/g, '');
    const phoneWithPrefix = digits.startsWith('0') ? '+88' + digits : digits;
    return phoneWithPrefix + '@khanbari.somity';
  };

  const getPhoneFromEmail = () => {
    const email = auth.currentUser?.email;
    if (!email) return '';
    return email.split('@')[0].replace(/^\+88/, '0');
  };

  const handleChangePin = async () => {
    const phone = pinForm.phone || getPhoneFromEmail();
    if (!phone) {
      toast.error('ফোন নম্বর দিন');
      return;
    }
    if (!pinForm.previousPin || !pinForm.newPin || !pinForm.confirmPin) {
      toast.error('সব ফিল্ড পূরণ করুন');
      return;
    }
    if (pinForm.newPin.length !== 6) {
      toast.error('নতুন পিন ৬ সংখ্যার হতে হবে');
      return;
    }
    if (pinForm.newPin !== pinForm.confirmPin) {
      toast.error('নতুন পিন এবং কনফার্ম পিন মিলেনি');
      return;
    }
    
    setChangingPin(true);
    try {
      const emailAsPhone = formatPhoneAsEmail(phone);
      await signInWithEmailAndPassword(auth, emailAsPhone, pinForm.previousPin);
      await updatePassword(auth.currentUser, pinForm.newPin);
      await axios.post('/member/change-pin', { newPin: pinForm.newPin });
      toast.success('পিন পরিবর্তন হয়েছে');
      setChangePinMode(false);
      setPinForm({ phone: '', previousPin: '', newPin: '', confirmPin: '' });
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        toast.error('পুরাতন পিন ভুল');
      } else if (err.code === 'auth/requires-recent-login') {
        toast.error('নতুন করে লগইন করে আবার চেষ্টা করুন');
      } else {
        toast.error('পিন পরিবর্তন ব্যর্থ');
      }
    } finally {
      setChangingPin(false);
    }
  };

  const totalBalance = totalBalanceData?.totalBalance || 0;
  const myBalance = dbUser?.balance || 0;

  return (
    <div className="pb-24">
      <div className="relative h-32 bg-gradient-to-r from-blue-600 to-blue-700 overflow-hidden">
        {(coverPreview || dbUser?.coverPhoto) && (
          <img src={coverPreview || dbUser.coverPhoto} alt="" className="w-full h-full object-cover" />
        )}
        <button onClick={() => coverRef.current?.click()} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 hover:bg-black/50 backdrop-blur-sm flex items-center justify-center transition-all active:scale-95">
          <Camera size={16} className="text-white" />
        </button>
        <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={e => {
          const f = e.target.files[0];
          if (!f) return;
          setCoverFile(f);
          setCoverPreview(URL.createObjectURL(f));
        }} />
      </div>

      <div className="px-4">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 mt-8 mb-4">
          <div className="flex items-end gap-3 mb-3">
            <div className="relative">
              <div className="w-16 h-16 rounded-xl overflow-hidden ring-4 ring-white shadow-md bg-gradient-to-br from-blue-100 to-indigo-100">
                {(avatarPreview || dbUser?.avatar) ? (
                  <img src={avatarPreview || dbUser.avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl font-bold bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                    {dbUser?.name?.[0] || '?'}
                  </div>
                )}
              </div>
              <button onClick={() => avatarRef.current?.click()} className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center shadow-md transition-all active:scale-95">
                <Edit2 size={10} className="text-white" />
              </button>
              <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={e => {
                const f = e.target.files[0];
                if (!f) return;
                setAvatarFile(f);
                setAvatarPreview(URL.createObjectURL(f));
              }} />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-gray-800 text-base truncate">{dbUser?.name || '...'}</h2>
                {dbUser?.bloodGroup && dbUser.bloodGroup !== '' && (
                  <span className="flex-shrink-0 px-2 py-0.5 rounded-lg text-xs font-bold bg-red-100 text-red-600">
                    🩸 {dbUser.bloodGroup}
                  </span>
                )}
              </div>
              {(!dbUser?.bloodGroup || dbUser.bloodGroup === '') && (
                <button onClick={openEdit} className="text-xs text-red-500 hover:text-red-600 underline">
                  + রক্তের গ্রুপ যোগ করুন
                </button>
              )}
              <p className="text-xs text-blue-600 font-medium mt-0.5">{dbUser?.phone || getPhoneFromEmail()}</p>
              <button onClick={copyId} className="flex items-center gap-1.5 mt-0.5 group">
                <span className="text-xs text-gray-400 font-mono">{dbUser?.memberId}</span>
                {copied ? <CheckCircle size={12} className="text-green-500" /> : <Copy size={12} className="text-gray-300 group-hover:text-blue-500 transition-colors" />}
              </button>
              {isAdmin && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 mt-1">
                  👑 অ্যাডমিন
                </span>
              )}
            </div>
            
            <button onClick={editMode ? () => setEditMode(false) : openEdit} className="w-8 h-8 rounded-xl bg-gray-50 border border-gray-200 hover:bg-gray-100 flex items-center justify-center transition-all active:scale-95">
              {editMode ? <X size={14} className="text-gray-400" /> : <Edit2 size={14} className="text-gray-500" />}
            </button>
          </div>

          {(avatarFile || coverFile) && (
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <p className="text-xs text-blue-600 font-medium">
                {[avatarFile && 'প্রোফাইল ছবি', coverFile && 'কভার ছবি'].filter(Boolean).join(' + ')} পরিবর্তিত
              </p>
              <button onClick={() => updateMutation.mutate()} className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all active:scale-95">
                সেভ করুন
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-white rounded-xl p-3 text-center shadow-sm border border-gray-100">
            <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-100 mb-2">
              <Wallet size={14} className="text-green-600" />
            </div>
            <p className="text-base font-bold text-green-600">৳{totalBalance.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-0.5">সকলের ব্যালেন্স</p>
            {myBalance > 0 && <p className="text-xs font-semibold text-blue-600 mt-1">আপনার: ৳{myBalance.toLocaleString()}</p>}
          </div>
          
          <div className="bg-white rounded-xl p-3 text-center shadow-sm border border-gray-100">
            <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 mb-2">
              <TrendingUp size={14} className="text-blue-600" />
            </div>
            <p className="text-base font-bold text-blue-600">৳{(dbUser?.monthlyDeposit || 0).toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-0.5">এই মাসে</p>
          </div>
          
          <div className="bg-white rounded-xl p-3 text-center shadow-sm border border-gray-100">
            <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 mb-2">
              <Users size={14} className="text-gray-600" />
            </div>
            <p className="text-base font-bold text-gray-700">{dbUser?.transactionCount || 0}</p>
            <p className="text-xs text-gray-500 mt-0.5">লেনদেন</p>
          </div>
        </div>

        {isAdmin && stats && !statsLoading && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4 mb-4 border border-blue-100">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-full bg-blue-200 flex items-center justify-center">
                <TrendingUp size={12} className="text-blue-700" />
              </div>
              <p className="text-xs font-bold text-blue-700 uppercase tracking-wide">অ্যাডমিন ভিউ</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-blue-600">মোট সদস্য</p>
                <p className="text-lg font-bold text-blue-800">{stats.totalMembers || 0}</p>
              </div>
              <div>
                <p className="text-xs text-blue-600">মোট জমা</p>
                <p className="text-lg font-bold text-blue-800">৳{(stats.totalDeposits || 0).toLocaleString()}</p>
              </div>
            </div>
          </div>
        )}

        {editMode && (
          <div className="bg-white rounded-2xl p-4 mb-4 shadow-sm border border-gray-100">
            <p className="text-sm font-bold text-gray-700 mb-3">প্রোফাইল সম্পাদনা</p>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">নাম</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all" placeholder="আপনার নাম" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">ফোন</label>
                <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all" placeholder="০১XXXXXXXXX" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">রক্তের গ্রুপ</label>
                <select value={form.bloodGroup} onChange={e => setForm({ ...form, bloodGroup: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none bg-white">
                  <option value="">নির্বাচন করুন</option>
                  {BLOOD_GROUPS.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                </select>
              </div>
              <button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending} className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95">
                <div className="flex items-center justify-center gap-2">
                  <Save size={15} />
                  {updateMutation.isPending ? 'সেভ হচ্ছে...' : 'পরিবর্তন সেভ করুন'}
                </div>
              </button>
            </div>
          </div>
        )}
        

        {!editMode && dbUser?.bloodGroup && (
          <div className="bg-white rounded-2xl p-4 mb-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                <Users size={12} className="text-gray-600" />
              </div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">ব্যক্তিগত তথ্য</p>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
                  <Droplets size={14} className="text-red-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">রক্তের গ্রুপ</p>
                  <p className="text-sm font-semibold text-gray-700">{dbUser?.bloodGroup || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                  <Calendar size={14} className="text-gray-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">যোগদানের তারিখ</p>
                  <p className="text-sm font-semibold text-gray-700">{dbUser?.createdAt ? new Date(dbUser.createdAt).toLocaleDateString('bn-BD') : 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {changePinMode ? (
          <div className="bg-white rounded-2xl p-4 mb-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold text-gray-700">পিন পরিবর্তন</p>
              <button onClick={() => setChangePinMode(false)} className="p-1 hover:bg-gray-100 rounded">
                <X size={16} className="text-gray-400" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">ফোন নম্বর</label>
                <input type="tel" value={pinForm.phone} onChange={e => setPinForm({ ...pinForm, phone: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all" placeholder="০১XXXXXXXXX" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">পুরাতন পিন</label>
                <div className="relative">
                  <input type={showPins.previousPin ? 'text' : 'password'} value={pinForm.previousPin} onChange={e => setPinForm({ ...pinForm, previousPin: e.target.value.replace(/\D/g, '').slice(0, 6) })} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-center tracking-[0.25em]" placeholder="XXXXXX" maxLength={6} />
                  <button type="button" onClick={() => setShowPins({ ...showPins, previousPin: !showPins.previousPin })} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showPins.previousPin ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">নতুন পিন</label>
                <div className="relative">
                  <input type={showPins.newPin ? 'text' : 'password'} value={pinForm.newPin} onChange={e => setPinForm({ ...pinForm, newPin: e.target.value.replace(/\D/g, '').slice(0, 6) })} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-center tracking-[0.25em]" placeholder="XXXXXX" maxLength={6} />
                  <button type="button" onClick={() => setShowPins({ ...showPins, newPin: !showPins.newPin })} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showPins.newPin ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">কনফার্ম পিন</label>
                <div className="relative">
                  <input type={showPins.confirmPin ? 'text' : 'password'} value={pinForm.confirmPin} onChange={e => setPinForm({ ...pinForm, confirmPin: e.target.value.replace(/\D/g, '').slice(0, 6) })} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-center tracking-[0.25em]" placeholder="XXXXXX" maxLength={6} />
                  <button type="button" onClick={() => setShowPins({ ...showPins, confirmPin: !showPins.confirmPin })} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showPins.confirmPin ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <button onClick={handleChangePin} disabled={changingPin || pinForm.newPin !== pinForm.confirmPin} className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95">
                {changingPin ? 'পরিবর্তন হচ্ছে...' : 'পিন পরিবর্তন করুন'}
              </button>
            </div>
          </div>
        ) : (
          <button onClick={() => { 
          setPinForm({ ...pinForm, phone: dbUser?.phone || '', previousPin: '', newPin: '', confirmPin: '' }); 
          setChangePinMode(true); 
        }} className="w-full py-3 rounded-xl flex items-center justify-center gap-2 bg-gray-50 border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-100 active:scale-95 transition-all mb-4">
            <Lock size={16} />
            <span>পিন পরিবর্তন করুন</span>
          </button>
        )}

<button onClick={async () => { await logout(); navigate('/login'); }} className="w-full py-3 rounded-xl flex items-center justify-center gap-2 bg-red-50 border border-red-200 text-red-600 font-semibold text-sm hover:bg-red-100 active:scale-95 transition-all">
          <LogOut size={16} />
          <span>লগআউট</span>
        </button>
      </div>
    </div>
  );
};

export default Profile;