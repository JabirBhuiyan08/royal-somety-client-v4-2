// client/src/pages/NotFound.jsx
import { useNavigate } from 'react-router-dom';
const NotFound = () => {
  const navigate = useNavigate();
  return (
    <div className="app-container min-h-screen flex flex-col items-center justify-center bg-white px-6 text-center">
      <p className="text-8xl font-black text-slate-100 mb-2">404</p>
      <div className="text-5xl mb-4">🔍</div>
      <h2 className="text-lg font-bold text-slate-800 mb-2" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>পেজটি পাওয়া যায়নি</h2>
      <p className="text-sm text-slate-400 mb-6" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>আপনি যে পেজটি খুঁজছেন সেটি নেই।</p>
      <button onClick={() => navigate('/')} className="btn-primary" style={{ maxWidth: 200 }}>হোমে ফিরুন</button>
    </div>
  );
};
export default NotFound;
