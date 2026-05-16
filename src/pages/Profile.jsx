// client/src/pages/Profile.jsx
import { useState, useRef } from 'react';
import { useAuth } from '../providers/AuthProvider';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  Camera, Copy, CheckCircle, Phone, Droplets, Edit2, LogOut, 
  Save, X, Wallet, Lock, Eye, EyeOff, Calendar, Home
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useAxios from '../hooks/useAxios';
import toast from 'react-hot-toast';
import { BLOOD_GROUPS } from '../utils/constants';
import { auth } from '../utils/firebase';
import { signInWithEmailAndPassword, updatePassword } from 'firebase/auth';
import DepositModal from '../components/DepositModal';

// ==================== SIMPLE COMPONENTS ====================

const BigButton = ({ icon: Icon, label, onClick, color = 'blue', fullWidth = false }) => (
  <button
    onClick={onClick}
    className={`${fullWidth ? 'w-full' : 'flex-1'} py-4 rounded-xl text-base font-bold flex items-center justify-center gap-2 transition-all active:scale-95 ${
      color === 'blue' ? 'bg-blue-600 text-white hover:bg-blue-700' :
      color === 'red' ? 'bg-red-600 text-white hover:bg-red-700' :
      color === 'green' ? 'bg-green-600 text-white hover:bg-green-700' :
      'bg-gray-600 text-white hover:bg-gray-700'
    }`}
  >
    {Icon && <Icon size={20} />}
    <span>{label}</span>
  </button>
);

const SimpleCard = ({ children, className = '' }) => (
  <div className={`bg-white rounded-2xl p-4 shadow-sm border border-gray-100 ${className}`}>
    {children}
  </div>
);

const InfoRow = ({ label, value, onEdit, showEdit = false }) => (
  <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
    <span className="text-base text-gray-600">{label}</span>
    <div className="flex items-center gap-2">
      <span className="text-base font-semibold text-gray-800">{value || '—'}</span>
      {showEdit && (
        <button onClick={onEdit} className="p-1 hover:bg-gray-100 rounded">
          <Edit2 size={16} className="text-gray-400" />
        </button>
      )}
    </div>
  </div>
);

const NumberBox = ({ label, value, color = 'blue' }) => (
  <div className={`bg-${color}-50 rounded-xl p-3 text-center`}>
    <p className="text-lg font-bold text-gray-800">{value}</p>
    <p className="text-xs text-gray-500 mt-1">{label}</p>
  </div>
);

// ==================== MAIN COMPONENT ====================

const Profile = () => {
  const { dbUser, logout, isAdmin, setDbUser } = useAuth();
  const [copied, setCopied] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({});
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [changePinMode, setChangePinMode] = useState(false);
  const [pinForm, setPinForm] = useState({ previousPin: '', newPin: '', confirmPin: '' });
  const [showPin, setShowPin] = useState(false);
  const [changingPin, setChangingPin] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  
  const navigate = useNavigate();
  const axios = useAxios();
  const avatarRef = useRef(null);

  // Queries
  const { data: totalBalanceData } = useQuery({
    queryKey: ['total-balance'],
    queryFn: () => axios.get('/member/total-balance').then(r => r.data),
  });

  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => axios.get('/admin/stats').then(r => r.data),
    enabled: isAdmin,
  });

  // Mutation
  const updateMutation = useMutation({
    mutationFn: () => {
      const fd = new FormData();
      if (form.name) fd.append('name', form.name);
      if (form.phone !== undefined) fd.append('phone', form.phone);
      if (form.bloodGroup !== undefined) fd.append('bloodGroup', form.bloodGroup);
      if (avatarFile) fd.append('avatar', avatarFile);
      return axios.patch('/member/profile', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    },
    onSuccess: (res) => {
      setDbUser(res.data.user);
      toast.success('প্রোফাইল আপডেট হয়েছে');
      setEditMode(false);
      setAvatarFile(null);
      setAvatarPreview(null);
    },
    onError: () => toast.error('আপডেট ব্যর্থ হয়েছে'),
  });

  // Helper functions
  const getBbrcId = () => {
    const email = auth.currentUser?.email;
    if (!email) return '';
    const id = email.split('@')[0];
    return id;
  };

  const copyId = () => {
    navigator.clipboard.writeText(getBbrcId());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('আইডি কপি হয়েছে');
  };

  const openEdit = () => {
    setForm({
      name: dbUser?.name || '',
      phone: dbUser?.phone || '',
      bloodGroup: dbUser?.bloodGroup || ''
    });
    setEditMode(true);
  };

  const handleChangePin = async () => {
    if (!pinForm.previousPin || !pinForm.newPin || !pinForm.confirmPin) {
      toast.error('সব ঘর পূরণ করুন');
      return;
    }
    if (pinForm.newPin.length !== 6) {
      toast.error('৬ সংখ্যার পিন দিন');
      return;
    }
    if (pinForm.newPin !== pinForm.confirmPin) {
      toast.error('পিন দুটি মিলছে না');
      return;
    }

    setChangingPin(true);
    try {
      const email = `${getBbrcId()}@khanbari.somity`;
      await signInWithEmailAndPassword(auth, email, pinForm.previousPin);
      await updatePassword(auth.currentUser, pinForm.newPin);
      await axios.post('/member/change-pin', { newPin: pinForm.newPin });
      
      toast.success('পিন পরিবর্তন হয়েছে');
      setChangePinMode(false);
      setPinForm({ previousPin: '', newPin: '', confirmPin: '' });
    } catch (err) {
      if (err.code === 'auth/wrong-password') {
        toast.error('পুরাতন পিন ভুল');
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
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Simple Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 pt-8 pb-12 px-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-blue-100 text-sm">স্বাগতম</p>
            <h1 className="text-xl font-bold text-white mt-1">{dbUser?.name || 'সদস্য'}</h1>
          </div>
          <button 
            onClick={() => navigate('/')}
            className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center"
          >
            <Home size={20} className="text-white" />
          </button>
        </div>
      </div>

      {/* Profile Content */}
      <div className="px-4 -mt-10">
        {/* Avatar Card */}
        <SimpleCard className="flex items-center gap-4">
          <div className="relative">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-blue-400 to-blue-600">
              {(avatarPreview || dbUser?.avatar) ? (
                <img src={avatarPreview || dbUser.avatar} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-white">
                  {dbUser?.name?.[0]?.toUpperCase() || '?'}
                </div>
              )}
            </div>
            <button 
              onClick={() => avatarRef.current?.click()} 
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center shadow-lg"
            >
              <Camera size={12} className="text-white" />
            </button>
            <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={e => {
              const f = e.target.files[0];
              if (!f) return;
              setAvatarFile(f);
              setAvatarPreview(URL.createObjectURL(f));
            }} />
          </div>
          <div className="flex-1">
            <button 
              onClick={copyId} 
              className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-lg"
            >
              <span className="text-sm font-mono text-gray-700">{getBbrcId()}</span>
              {copied ? <CheckCircle size={14} className="text-green-500" /> : <Copy size={14} className="text-gray-400" />}
            </button>
            {isAdmin && (
              <span className="inline-block mt-2 px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-lg">
                অ্যাডমিন
              </span>
            )}
          </div>
        </SimpleCard>

        {/* Numbers Row */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <NumberBox label="আপনার ব্যালেন্স" value={`৳${myBalance.toLocaleString()}`} color="green" />
          <NumberBox label="সকলের ব্যালেন্স" value={`৳${totalBalance.toLocaleString()}`} color="blue" />
        </div>

        {/* Info Cards */}
        <SimpleCard className="mt-4">
          <InfoRow label="নাম" value={dbUser?.name} showEdit={!editMode} onEdit={openEdit} />
          <InfoRow label="ফোন" value={dbUser?.phone} showEdit={!editMode} onEdit={openEdit} />
          <InfoRow label="রক্তের গ্রুপ" value={dbUser?.bloodGroup} showEdit={!editMode} onEdit={openEdit} />
        </SimpleCard>

        {/* Blood Group Warning if missing */}
        {!dbUser?.bloodGroup && !editMode && (
          <SimpleCard className="mt-4 bg-red-50 border-red-200">
            <div className="flex items-center gap-3">
              <Droplets size={24} className="text-red-500" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-700">রক্তের গ্রুপ যোগ করুন</p>
                <p className="text-xs text-red-600 mt-0.5">জরুরি প্রয়োজনে ব্যবহার হবে</p>
              </div>
              <button onClick={openEdit} className="px-3 py-2 bg-red-600 text-white rounded-lg text-sm">
                যোগ করুন
              </button>
            </div>
          </SimpleCard>
        )}

        {/* Admin Section */}
        {isAdmin && stats && (
          <SimpleCard className="mt-4 bg-blue-50">
            <p className="text-sm font-bold text-blue-800 mb-3">অ্যাডমিন তথ্য</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-blue-600">মোট সদস্য</p>
                <p className="text-xl font-bold text-blue-800">{stats.totalMembers || 0}</p>
              </div>
              <div>
                <p className="text-xs text-blue-600">মোট জমা</p>
                <p className="text-xl font-bold text-blue-800">৳{(stats.totalDeposits || 0).toLocaleString()}</p>
              </div>
            </div>
          </SimpleCard>
        )}

         {/* Action Buttons */}
         <div className="space-y-3 mt-4">
           <BigButton 
             icon={Wallet} 
             label="জমা করুন" 
             onClick={() => setShowDepositModal(true)}
             color="green"
             fullWidth
           />
          
          {!changePinMode ? (
            <BigButton 
              icon={Lock} 
              label="পিন পরিবর্তন করুন" 
              onClick={() => setChangePinMode(true)}
              color="blue"
              fullWidth
            />
          ) : (
            <SimpleCard className="bg-gray-50">
              <p className="text-base font-bold text-gray-800 mb-3">পিন পরিবর্তন</p>
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">পুরাতন পিন</label>
                  <div className="relative">
                    <input 
                      type={showPin ? 'text' : 'password'} 
                      value={pinForm.previousPin} 
                      onChange={e => setPinForm({ ...pinForm, previousPin: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 text-lg text-center tracking-widest"
                      placeholder="৬ অংকের পিন"
                      maxLength={6}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">নতুন পিন</label>
                  <input 
                    type={showPin ? 'text' : 'password'} 
                    value={pinForm.newPin} 
                    onChange={e => setPinForm({ ...pinForm, newPin: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 text-lg text-center tracking-widest"
                    placeholder="৬ অংকের পিন"
                    maxLength={6}
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">আবার নতুন পিন দিন</label>
                  <input 
                    type={showPin ? 'text' : 'password'} 
                    value={pinForm.confirmPin} 
                    onChange={e => setPinForm({ ...pinForm, confirmPin: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 text-lg text-center tracking-widest"
                    placeholder="৬ অংকের পিন"
                    maxLength={6}
                  />
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setShowPin(!showPin)}
                    className="flex-1 py-3 rounded-xl bg-gray-200 text-gray-700 font-medium"
                  >
                    {showPin ? 'পিন লুকান' : 'পিন দেখান'}
                  </button>
                  <button 
                    onClick={() => setChangePinMode(false)}
                    className="flex-1 py-3 rounded-xl bg-gray-300 text-gray-700 font-medium"
                  >
                    বাতিল
                  </button>
                  <button 
                    onClick={handleChangePin} 
                    disabled={changingPin}
                    className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-medium"
                  >
                    {changingPin ? 'হচ্ছে...' : 'সেভ করুন'}
                  </button>
                </div>
              </div>
            </SimpleCard>
          )}

          <BigButton 
            icon={LogOut} 
            label="লগআউট" 
            onClick={async () => { await logout(); navigate('/login'); }}
            color="red"
            fullWidth
          />
        </div>
      </div>

      {/* Edit Modal - Simple Version */}
      {editMode && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setEditMode(false)}>
          <div className="w-full max-w-md bg-white rounded-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-800">প্রোফাইল এডিট</h3>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-sm text-gray-600 mb-1 block">নাম</label>
                <input 
                  value={form.name} 
                  onChange={e => setForm({ ...form, name: e.target.value })} 
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 text-base"
                  placeholder="আপনার নাম"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">ফোন নম্বর</label>
                <input 
                  value={form.phone} 
                  onChange={e => setForm({ ...form, phone: e.target.value })} 
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 text-base"
                  placeholder="০১XXXXXXXXX"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">রক্তের গ্রুপ</label>
                <select 
                  value={form.bloodGroup} 
                  onChange={e => setForm({ ...form, bloodGroup: e.target.value })} 
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 text-base bg-white"
                >
                  <option value="">নির্বাচন করুন</option>
                  {BLOOD_GROUPS.map(bg => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="p-5 border-t border-gray-100 flex gap-3">
              <button 
                onClick={() => setEditMode(false)} 
                className="flex-1 py-3 rounded-xl bg-gray-200 text-gray-700 font-medium"
              >
                বাতিল
              </button>
              <button 
                onClick={() => updateMutation.mutate()} 
                disabled={updateMutation.isPending}
                className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-medium"
              >
                {updateMutation.isPending ? 'সেভ হচ্ছে...' : 'সেভ করুন'}
              </button>
            </div>
          </div>
        </div>
      )}
      {showDepositModal && <DepositModal isOpen={showDepositModal} onClose={() => setShowDepositModal(false)} />}
    </div>
  );
};

export default Profile;