// client/src/hooks/usePresence.js
import { useEffect, useState } from 'react';
import { doc, setDoc, onSnapshot, collection, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { useAuth } from '../providers/AuthProvider';

const PRESENCE_COLLECTION = 'presence';
const STALE_MS = 60_000; // 60 seconds

const usePresence = () => {
  const { user, dbUser } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState([]);

  // Write own presence
  useEffect(() => {
    if (!user) return;

    const presenceRef = doc(db, PRESENCE_COLLECTION, user.uid);

    const write = () =>
      setDoc(presenceRef, {
        uid: user.uid,
        name: dbUser?.name || user.displayName || 'সদস্য',
        avatar: dbUser?.avatar || user.photoURL || null,
        lastSeen: serverTimestamp(),
      });

    write();
    const interval = setInterval(write, 30_000);

    // Clean up on unload
    const cleanup = () => deleteDoc(presenceRef);
    window.addEventListener('beforeunload', cleanup);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', cleanup);
      cleanup();
    };
  }, [user, dbUser]);

  // Subscribe to all presence docs
  useEffect(() => {
    if (!user) return;

    const unsub = onSnapshot(collection(db, PRESENCE_COLLECTION), (snap) => {
      const now = Date.now();
      const active = snap.docs
        .map((d) => d.data())
        .filter((p) => {
          const ts = p.lastSeen?.toMillis?.();
          return ts && now - ts < STALE_MS;
        });
      setOnlineUsers(active);
    });

    return () => unsub();
  }, [user]);

  return { onlineUsers, onlineCount: onlineUsers.length };
};

export default usePresence;
