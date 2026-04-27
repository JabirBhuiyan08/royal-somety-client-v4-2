// client/src/pages/Signup.jsx
import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../utils/firebase';
import api, { suppressAuthRedirect } from '../utils/api';
import { Eye, EyeOff, User, Droplet, Lock, LogIn, Shield } from 'lucide-react';
import { BLOOD_GROUPS } from '../utils/constants';
import toast from 'react-hot-toast';
import { useAuth } from '../providers/AuthProvider';
// import Logo from '..//assets/logo.png';

const Signup = () => {
  const [form, setForm] = useState({ name: '', bbrcNumber: '', bloodGroup: '' });
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [availableNumbers, setAvailableNumbers] = useState([]);
  const [loadingNumbers, setLoadingNumbers] = useState(false);
  const navigate = useNavigate();
  const { user, dbUser, loading: authLoading } = useAuth();
  const registeredRef = useRef(false);

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user && dbUser) {
      navigate('/', { replace: true });
    }
  }, [user, dbUser, authLoading, navigate]);

  // Load available BBRC numbers once on mount
  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();
    
    const fetchAvailableNumbers = async () => {
      try {
        setLoadingNumbers(true);
        const token = localStorage.getItem('token');
        const res = await api.get('/auth/available-bbrc-numbers', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          signal: controller.signal
        });
        if (mounted) {
          if (res.data && res.data.numbers) {
            setAvailableNumbers(res.data.numbers);
          } else {
            throw new Error('Invalid response format');
          }
        }
      } catch (err) {
        if (mounted && err.name !== 'AbortError') {
          console.error('Failed to load available numbers:', err);
          // Generate default numbers 1-500 if API fails
          const nums = Array.from({ length: 500 }, (_, i) => 
            String(i + 1).padStart(4, '0')
          );
          setAvailableNumbers(nums);
        }
      }
      if (mounted) {
        setLoadingNumbers(false);
      }
    };
    fetchAvailableNumbers();
    
    return () => { 
      mounted = false;
      controller.abort();
    };
  }, []);

  // Format BBRC ID as email (Firebase requires email format for authentication)
  const formatBbrcAsEmail = (bbrcNumber) => {
    return `BBRC${String(bbrcNumber).padStart(4, '0')}@khanbari.somity`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.bbrcNumber) {
      toast.error('BBRC নম্বর নির্বাচন করুন');
      return;
    }
    if (pin !== confirmPin) {
      toast.error('পিন মিলছে না');
      return;
    }
    if (pin.length !== 6) {
      toast.error('৬ সংখ্যার পিন দিন');
      return;
    }
    setLoading(true);
    registeredRef.current = false;
    try {
      const email = formatBbrcAsEmail(form.bbrcNumber);
      const cred = await createUserWithEmailAndPassword(auth, email, pin);
      await updateProfile(cred.user, { displayName: form.name });
      
      const token = await cred.user.getIdToken();
      
      // Use suppressAuthRedirect to prevent redirect loops during registration
      await suppressAuthRedirect(() => api.post('/auth/register', { 
        uid: cred.user.uid, 
        name: form.name, 
        phone: `BBRC${String(form.bbrcNumber).padStart(4, '0')}`,
        bloodGroup: form.bloodGroup 
      },
        { headers: { Authorization: `Bearer ${token}` } }));
      
      registeredRef.current = true;
      toast.success('নিবন্ধন সফল! স্বাগতম!');
      navigate('/');
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        toast.error('এই BBRC ID দিয়ে আগে অ্যাকাউন্ট তৈরি হয়েছে। লগইন করুন।');
        navigate('/login');
      } else {
        toast.error('নিবন্ধন ব্যর্থ হয়েছে');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex flex-col justify-center px-6 py-10">
      <div className="max-w-[480px] mx-auto w-full">
        {/* Logo & Title Section */}
        <div className="text-center mb-8">
          <img src={} alt="Logo" className="w-16 h-16 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            নতুন সদস্য নিবন্ধন
          </h1>
          <p className="text-gray-500 text-sm">
            ভাই ভাই রয়্যাল সমিতি
          </p>
        </div>

        {/* Signup Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Full Name */}
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <User size={16} className="text-blue-500" />
              পূর্ণ নাম
            </label>
            <input 
              type="text" 
              value={form.name} 
              onChange={e => setForm({ ...form, name: e.target.value })} 
              placeholder="আপনার পূর্ণ নাম" 
              required 
              className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all bg-white"
            />
          </div>

           {/* BBRC ID Selection */}
           <div>
             <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
               <Shield size={16} className="text-blue-500" />
               BBRC নম্বর
             </label>
             {loadingNumbers ? (
               <div className="w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-white text-gray-500 text-sm">
                 লোড হচ্ছে...
               </div>
             ) : (
               <select 
                 value={form.bbrcNumber} 
                 onChange={e => setForm({ ...form, bbrcNumber: e.target.value })} 
                 required 
                 className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all bg-white appearance-none cursor-pointer"
               >
                 <option value="">BBRC নম্বর নির্বাচন করুন</option>
                 {availableNumbers.map(num => (
                   <option key={num} value={num}>BBRC{num}</option>
                 ))}
               </select>
             )}
           </div>

          {/* Blood Group */}
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <Droplet size={16} className="text-red-500" />
              রক্তের গ্রুপ
            </label>
            <select 
              value={form.bloodGroup} 
              onChange={e => setForm({ ...form, bloodGroup: e.target.value })} 
              required 
              className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all bg-white"
            >
              <option value="">রক্তের গ্রুপ নির্বাচন করুন</option>
              {BLOOD_GROUPS.map(bg => <option key={bg} value={bg}>{bg}</option>)}
            </select>
          </div>

          {/* PIN */}
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <Lock size={16} className="text-blue-500" />
              ৬ সংখ্যার পিন
            </label>
            <div className="relative">
              <input
                type={showPin ? 'text' : 'password'}
                value={pin}
                onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="XXXXXX"
                required
                className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all bg-white text-center tracking-[0.25em] text-lg font-semibold"
                maxLength={6}
              />
              <button 
                type="button" 
                onClick={() => setShowPin(!showPin)} 
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPin ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Confirm PIN */}
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <Shield size={16} className="text-blue-500" />
              পিন নিশ্চিত করুন
            </label>
            <input
              type={showPin ? 'text' : 'password'}
              value={confirmPin}
              onChange={e => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="XXXXXX"
              required
              className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all bg-white text-center tracking-[0.25em] text-lg font-semibold"
              maxLength={6}
            />
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            disabled={loading} 
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>অপেক্ষা করুন...</span>
              </>
            ) : (
              <>
                <LogIn size={18} />
                <span>নিবন্ধন করুন</span>
              </>
            )}
          </button>
        </form>

        {/* Login Link */}
        <p className="text-center text-gray-500 text-sm mt-8">
          ইতিমধ্যে অ্যাকাউন্ট আছে?{' '}
          <Link to="/login" className="text-blue-600 font-semibold hover:text-blue-700 transition-colors">
            লগইন করুন
          </Link>
        </p>

        {/* Footer Note */}
        <p className="text-center text-xs text-gray-400 mt-6">
          অ্যাডমিনের মাধ্যমে অ্যাকাউন্ট তৈরি করুন
        </p>
      </div>
    </div>
  );
};

export default Signup;