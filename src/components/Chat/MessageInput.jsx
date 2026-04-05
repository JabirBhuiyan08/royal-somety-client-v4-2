// client/src/components/Chat/MessageInput.jsx
import { useState } from 'react';
import { Send } from 'lucide-react';

const MessageInput = ({ onSend, disabled }) => {
  const [text, setText] = useState('');

  const handleSend = () => {
    const t = text.trim(); if (!t || disabled) return;
    onSend(t); setText('');
  };

  return (
    <div className="flex items-end gap-2 px-3 py-3 bg-white border-t border-slate-100">
      <textarea value={text} onChange={e => setText(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
        placeholder="মেসেজ লিখুন..." rows={1} disabled={disabled}
        className="flex-1 resize-none rounded-2xl px-4 py-2.5 text-sm outline-none border border-slate-200 bg-slate-50 focus:border-blue-300 transition-colors"
        style={{ fontFamily: "'Hind Siliguri', sans-serif", maxHeight: 100, lineHeight: 1.5, color: '#1a1a2e' }}
        onInput={e => { e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px'; }} />
      <button onClick={handleSend} disabled={!text.trim() || disabled}
        className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all active:scale-90"
        style={{ background: text.trim() ? '#2563eb' : '#e2e8f0' }}>
        <Send size={16} style={{ color: text.trim() ? '#fff' : '#94a3b8' }} />
      </button>
    </div>
  );
};
export default MessageInput;
