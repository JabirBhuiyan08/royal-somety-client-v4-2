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

    try {
      const syncRes = await suppressAuthRedirect(() => api.post(
        '/auth/sync',
        { uid: firebaseUser.uid, name: firebaseUser.displayName || 'সদস্য', email: firebaseUser.email, photoURL: firebaseUser.photoURL || null },
        { headers: { Authorization: `Bearer ${token}` } }
      ));
      console.log('[Auth] Sync response:', syncRes.data);
      return syncRes.data.user;
    } catch (err) {
      console.error('[Auth] Sync error:', err.message, err.response?.status);
      if (err.response?.status === 401 || err.response?.status === 404) {
        console.log('[Auth] Sync endpoint failed, attempting register as fallback');
        try {
          const registerRes = await suppressAuthRedirect(() => api.post('/auth/register',
            { uid: firebaseUser.uid, name: firebaseUser.displayName || 'সদস্য', phone: firebaseUser.email?.split('@')[0] || '' },
            { headers: { Authorization: `Bearer ${token}` } }
          ));
          console.log('[Auth] Register fallback response:', registerRes.data);
          return registerRes.data.user;
        } catch (registerErr) {
          console.error('[Auth] Register fallback also failed:', registerErr.message);
        }
      }
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
