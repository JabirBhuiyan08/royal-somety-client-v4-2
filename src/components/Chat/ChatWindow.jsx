// client/src/components/Chat/ChatWindow.jsx
import { useEffect, useRef, useState } from 'react';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, limit } from 'firebase/firestore';
import { db } from '../../utils/firebase';
import { useAuth } from '../../providers/AuthProvider';
import usePresence from '../../hooks/usePresence';
import ChatBubble from './ChatBubble';
import MessageInput from './MessageInput';
import { Users, Wifi, WifiOff } from 'lucide-react';
import toast from 'react-hot-toast';

const CHAT_COLLECTION = 'somity-chat';

const ChatWindow = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [online, setOnline] = useState(true);
  const bottomRef = useRef(null);
  const { user, dbUser } = useAuth();
  const { onlineCount } = usePresence();

  useEffect(() => {
    const q = query(collection(db, CHAT_COLLECTION), orderBy('createdAt', 'asc'), limit(100));
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false); setOnline(true);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }, (err) => { console.error(err); setOnline(false); setLoading(false); toast.error('চ্যাট সংযোগ বিচ্ছিন্ন'); });
    return () => unsub();
  }, []);

  const sendMessage = async (text) => {
    if (!user) { toast.error('মেসেজ পাঠাতে লগইন করুন'); return; }
    try {
      await addDoc(collection(db, CHAT_COLLECTION), {
        text, senderId: user.uid,
        senderName: dbUser?.name || user.displayName || 'সদস্য',
        senderAvatar: dbUser?.avatar || user.photoURL || null,
        createdAt: serverTimestamp(),
      });
    } catch { toast.error('মেসেজ পাঠানো ব্যর্থ'); }
  };

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 120px)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-base">💬</div>
          <div>
            <p className="text-sm font-bold text-slate-800" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>সমিতি গ্রুপ চ্যাট</p>
            <div className="flex items-center gap-1">
              {online ? <Wifi size={10} className="text-green-500" /> : <WifiOff size={10} className="text-red-500" />}
              <span className="text-xs text-slate-400" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>{online ? 'সংযুক্ত' : 'অফলাইন'}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-50 border border-slate-100">
          <Users size={12} className="text-slate-400" />
          <span className="text-xs text-slate-500">{onlineCount} অনলাইন</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 bg-slate-50">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="w-7 h-7 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <div className="text-5xl">💬</div>
            <p className="text-slate-400 text-sm text-center" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>প্রথম মেসেজ পাঠান!</p>
          </div>
        ) : (
          <>
            {messages.map(msg => (
              <ChatBubble key={msg.id} message={msg} isOwn={msg.senderId === user?.uid}
                senderName={msg.senderName} senderAvatar={msg.senderAvatar} />
            ))}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      <MessageInput onSend={sendMessage} disabled={!online} />
    </div>
  );
};

export default ChatWindow;
