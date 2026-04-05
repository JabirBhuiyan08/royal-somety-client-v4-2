// client/src/pages/Signup.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../utils/firebase';
import api from '../utils/api';
import { Eye, EyeOff, User, Phone, Droplet, Lock, LogIn, Crown, Shield } from 'lucide-react';
import { BLOOD_GROUPS } from '../utils/constants';
import toast from 'react-hot-toast';

const Signup = () => {
  const [form, setForm] = useState({ name: '', phone: '', bloodGroup: '' });
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Format phone as email (Firebase requires email format for authentication)
  const formatPhoneAsEmail = (value) => {
    const digits = value.replace(/\D/g, '');
    const phoneWithPrefix = digits.startsWith('0') ? '+88' + digits : digits;
    return phoneWithPrefix + '@khanbari.somity';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.phone || form.phone.length < 11) {
      toast.error('সঠিক ফোন নম্বর দিন');
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
    try {
      const emailAsPhone = formatPhoneAsEmail(form.phone);
      const cred = await createUserWithEmailAndPassword(auth, emailAsPhone, pin);
      await updateProfile(cred.user, { displayName: form.name });
      
      const token = await cred.user.getIdToken();
      await api.post('/auth/register', { 
        uid: cred.user.uid, 
        name: form.name, 
        phone: form.phone, 
        bloodGroup: form.bloodGroup 
      },
        { headers: { Authorization: `Bearer ${token}` } });
      toast.success('নিবন্ধন সফল! স্বাগতম!');
      navigate('/');
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        toast.error('এই ফোন নম্বরে আগে অ্যাকাউন্ট তৈরি হয়েছে। লগইন করুন।');
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
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-blue-200">
            <Crown size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            নতুন সদস্য নিবন্ধন
          </h1>
          <p className="text-gray-500 text-sm">
            খানবাড়ি ভাই ভাই রয়্যাল সমিতি
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

          {/* Phone Number */}
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
                value={form.phone} 
                onChange={e => setForm({ ...form, phone: e.target.value })} 
                placeholder="01XXXXXXXXX" 
                required 
                className="w-full pl-14 pr-4 py-3.5 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all bg-white"
              />
            </div>
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