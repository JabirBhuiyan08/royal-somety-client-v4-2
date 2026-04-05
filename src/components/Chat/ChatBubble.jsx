// client/src/components/Chat/ChatBubble.jsx
import { formatDistanceToNow } from 'date-fns';

const ChatBubble = ({ message, isOwn, senderName, senderAvatar }) => {
  const time = message.createdAt?.toDate
    ? formatDistanceToNow(message.createdAt.toDate(), { addSuffix: true }) : 'এখন';

  return (
    <div className={`flex gap-2 mb-3 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
      {!isOwn && (
        <div className="w-8 h-8 rounded-full flex-shrink-0 overflow-hidden bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600 border border-white shadow-sm">
          {senderAvatar ? <img src={senderAvatar} alt="" className="w-full h-full object-cover" /> : senderName?.[0]}
        </div>
      )}
      <div className={`flex flex-col max-w-[72%] ${isOwn ? 'items-end' : 'items-start'}`}>
        {!isOwn && <span className="text-xs text-slate-400 mb-1 px-1" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>{senderName}</span>}
        <div className={`px-4 py-2.5 text-sm leading-relaxed rounded-2xl ${isOwn ? 'rounded-br-sm bg-blue-600 text-white' : 'rounded-bl-sm bg-white text-slate-800 shadow-sm border border-slate-100'}`}
          style={{ fontFamily: "'Hind Siliguri', sans-serif", wordBreak: 'break-word' }}>
          {message.text}
        </div>
        <span className="text-xs text-slate-400 mt-1 px-1">{time}</span>
      </div>
    </div>
  );
};
export default ChatBubble;
