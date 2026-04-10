// client/src/providers/AuthProvider.jsx
import { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '../utils/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import api, { suppressAuthRedirect } from '../utils/api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [dbUser, setDbUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Validate token and get user data from backend
  const validateToken = async (token) => {
    try {
      console.log('[Auth] Validating token...');
      const res = await suppressAuthRedirect(() => api.get('/auth/me', { headers: { Authorization: `Bearer ${token}` } }));
      console.log('[Auth] Token valid, user data:', res.data.user);
      return res.data.user;
    } catch (err) {
      console.error('[Auth] Token validation failed:', err.message, err.response?.status);
      return null;
    }
  };

  // Sync Firebase user with backend
  const syncUser = async (firebaseUser) => {
    const token = await firebaseUser.getIdToken(true);
    localStorage.setItem('token', token);
    console.log('[Auth] Syncing user with backend, token obtained');
    console.log('[Auth] Token (first 50 chars):', token.substring(0, 50) + '...');

    try {
      const syncRes = await suppressAuthRedirect(() => api.post('/auth/sync', 
        { 
          uid: firebaseUser.uid, 
          name: firebaseUser.displayName || 'সদস্য', 
          email: firebaseUser.email, 
          photoURL: firebaseUser.photoURL || null,
          // Extract phone from email format (e.g., +8801749424565@khanbari.somity -> 01749424565)
          phone: firebaseUser.email?.split('@')[0]?.replace(/^\+88/, '0') || '' 
        },
        { headers: { Authorization: `Bearer ${token}` } }
      ));
      console.log('[Auth] Sync response:', syncRes.data);
      return syncRes.data.user;
    } catch (err) {
      console.error('[Auth] Sync error:', err.message, err.response?.status, err.response?.data);
      
      // Handle specific backend errors with friendly messages
      const status = err.response?.status;
      const errorData = err.response?.data;
      
      if (status === 500) {
        // Server error - try register fallback first
        console.log('[Auth] Server error, attempting register as fallback');
        try {
          const registerRes = await suppressAuthRedirect(() => api.post('/auth/register',
            { uid: firebaseUser.uid, name: firebaseUser.displayName || 'সদস্য', phone: firebaseUser.email?.split('@')[0] || '' },
            { headers: { Authorization: `Bearer ${token}` } }
          ));
          console.log('[Auth] Register fallback response:', registerRes.data);
          
          // Check if user was actually created/returned
          if (!registerRes.data.user) {
            console.log('[Auth] Register returned null user, showing error');
            setTimeout(() => toast.error('অ্যাকাউন্ট তৈরি হয়নি, অ্যাডমিনের সাথে যোগাযোগ করুন'), 100);
            return null;
          }
          
          return registerRes.data.user;
        } catch (registerErr) {
          console.error('[Auth] Register fallback also failed:', registerErr.message, registerErr.response?.data);
          // Show error to user via toast (delayed to avoid React state warning)
          setTimeout(() => toast.error('সার্ভার সমস্যা হয়েছে, আবার চেষ্টা করুন'), 100);
        }
      } else if (status === 401 || status === 404) {
        console.log('[Auth] Sync endpoint failed, attempting register as fallback');
        try {
          const registerRes = await suppressAuthRedirect(() => api.post('/auth/register',
            { uid: firebaseUser.uid, name: firebaseUser.displayName || 'সদস্য', phone: firebaseUser.email?.split('@')[0] || '' },
            { headers: { Authorization: `Bearer ${token}` } }
          ));
          console.log('[Auth] Register fallback response:', registerRes.data);
          
          // Check if user was actually created/returned
          if (!registerRes.data.user) {
            console.log('[Auth] Register returned null user, showing error');
            setTimeout(() => toast.error('অ্যাকাউন্ট তৈরি হয়নি, অ্যাডমিনের সাথে যোগাযোগ করুন'), 100);
            return null;
          }
          
          return registerRes.data.user;
        } catch (registerErr) {
          console.error('[Auth] Register fallback also failed:', registerErr.message, registerErr.response?.data);
        }
      } else if (status === 403) {
        setTimeout(() => toast.error('অ্যাক্সেস বন্ধ আছে'), 100);
      } else if (status >= 500) {
        setTimeout(() => toast.error('সার্ভার সমস্যা হয়েছে'), 100);
      } else {
        setTimeout(() => toast.error('কিছু সমস্যা হয়েছে'), 100);
      }
      
      // Try validation with stored token as last resort
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        console.log('[Auth] Trying fallback token validation');
        return await validateToken(storedToken);
      }
      console.log('[Auth] No stored token, returning null');
      return null;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('[Auth] onAuthStateChanged triggered, firebaseUser:', firebaseUser ? 'exists' : 'null');
      // Always process auth state changes, but avoid duplicate processing during initial load
      if (firebaseUser) {
        setUser(firebaseUser);
        console.log('[Auth] Firebase user set, syncing with backend...');
        const syncedDbUser = await syncUser(firebaseUser);
        console.log('[Auth] Synced dbUser:', syncedDbUser);
        setDbUser(syncedDbUser);
      } else {
        console.log('[Auth] No Firebase user, checking stored token...');
        // No Firebase user - check if we have a valid stored token
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
          const validatedUser = await validateToken(storedToken);
          if (validatedUser) {
            console.log('[Auth] Token validated, dbUser:', validatedUser);
            setDbUser(validatedUser);
            // Note: Firebase user will be null but we have valid backend session
          } else {
            console.log('[Auth] Token validation failed, clearing auth');
            setUser(null); setDbUser(null); localStorage.removeItem('token');
          }
        } else {
          console.log('[Auth] No stored token, user not authenticated');
          setUser(null); setDbUser(null);
        }
      }
      // Only set loading to false after initial auth check is complete
      console.log('[Auth] Setting loading to false');
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Refresh token every 50 min (expires after 60)
  useEffect(() => {
    if (!user) return;
    const t = setInterval(async () => {
      try { 
        const newToken = await user.getIdToken(true);
        localStorage.setItem('token', newToken);
      } catch { 
        // Token refresh failed - user may need to re-login
        console.warn('Token refresh failed'); 
      }
    }, 50 * 60 * 1000);
    return () => clearInterval(t);
  }, [user]);

  const logout = async () => {
    try {
      await signOut(auth);
    } catch { /* ignore Firebase sign out errors */ }
    localStorage.removeItem('token');
    setUser(null); setDbUser(null);
    toast.success('লগআউট সফল হয়েছে');
  };

  return (
    <AuthContext.Provider value={{ user, dbUser, loading, logout, isAdmin: dbUser?.role === 'admin', setDbUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export default AuthContext;
