// client/src/pages/Login.jsx
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../utils/firebase';
import { Eye, EyeOff, Phone, Lock, LogIn, Crown } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../providers/AuthProvider';

const Login = () => {
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [justLoggedIn, setJustLoggedIn] = useState(false);
  const navigate = useNavigate();
  const { user, dbUser, loading: authLoading } = useAuth();

  // Redirect if already logged in (after auth is fully loaded)
  // Also handle redirect after successful login once dbUser is synced
  useEffect(() => {
    console.log('[Login] useEffect triggered:', { user: !!user, dbUser: !!dbUser, authLoading, justLoggedIn });
    // Skip during initial auth loading
    if (authLoading) {
      console.log('[Login] Auth loading, skipping redirect');
      return;
    }
    
    // If user exists and dbUser is synced, redirect to home
    if (user && dbUser) {
      console.log('[Login] User and dbUser exist, navigating to home');
      if (justLoggedIn) {
        toast.success('লগইন সফল!');
      }
      navigate('/', { replace: true });
    } else {
      console.log('[Login] Missing user or dbUser, staying on login');
    }
  }, [user, dbUser, authLoading, navigate, justLoggedIn]);

  // Format phone as email (Firebase requires email format for authentication)
  const formatPhoneAsEmail = (value) => {
    const digits = value.replace(/\D/g, '');
    const phoneWithPrefix = digits.startsWith('0') ? '+88' + digits : digits;
    return phoneWithPrefix + '@khanbari.somity';
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!phone || !pin) {
      toast.error('ফোন নম্বর এবং পিন দিন');
      return;
    }
    if (pin.length !== 6) {
      toast.error('৬ সংখ্যার পিন দিন');
      return;
    }
    setLoading(true);
    setJustLoggedIn(true);
    console.log('[Login] Attempting login with phone:', phone);
    try {
      const emailAsPhone = formatPhoneAsEmail(phone);
      console.log('[Login] Calling Firebase signInWithEmailAndPassword');
      await signInWithEmailAndPassword(auth, emailAsPhone, pin);
      console.log('[Login] Firebase login successful');
      // Don't navigate here - AuthProvider's onAuthStateChanged will update state
      // and the useEffect above will handle redirect once dbUser is synced
      // This ensures we wait for the backend sync to complete before showing the home page
    } catch (err) {
      console.error('[Login] Firebase login error:', err.code, err.message);
      toast.error('ফোন নম্বর বা পিন ভুল');
      setLoading(false);
      setJustLoggedIn(false); // Reset flag on error so we don't show success toast
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex flex-col justify-center px-6 py-10">
      <div className="max-w-[480px] mx-auto w-full">
        {/* Logo & Title Section */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-blue-200">
            <Crown size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            খানবাড়ি ভাই ভাই
          </h1>
          <p className="text-gray-500 text-sm">
            রয়্যাল সমিতি — লগইন করুন
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          {/* Phone Number Field */}
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <Phone size={16} className="text-blue-500" />
              ফোন নম্বর
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <span className="text-sm font-medium">+88</span>
              </div>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="01XXXXXXXXX"
                required
                className="w-full pl-14 pr-4 py-3.5 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all bg-white"
              />
            </div>
          </div>

          {/* PIN Field */}
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <Lock size={16} className="text-blue-500" />
              ৬ সংখ্যার পিন
            </label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={pin}
                onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="XXXXXX"
                required
                className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all bg-white text-center tracking-[0.25em] text-lg font-semibold"
                maxLength={6}
              />
              <button 
                type="button" 
                onClick={() => setShowPass(!showPass)} 
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Login Button */}
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
                <span>লগইন করুন...</span>
              </>
            )}
          </button>
        </form>

        {/* Signup Link */}
        <p className="text-center text-gray-500 text-sm mt-8">
          অ্যাকাউন্ট নেই?{' '}
          <Link to="/signup" className="text-blue-600 font-semibold hover:text-blue-700 transition-colors">
            নিবন্ধন করুন
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

export default Login;