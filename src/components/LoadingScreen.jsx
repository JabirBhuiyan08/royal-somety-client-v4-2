// client/src/components/LoadingScreen.jsx
import loadingPageImage from '../../assets/loadingPage.png';

const LoadingScreen = ({ message = 'লোড হচ্ছে...' }) => (
  <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-white">
    <img src={loadingPageImage} alt="Loading" className="w-80 h-80 object-contain mb-5" />
    <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4" style={{ borderWidth: 3 }} />
    <h2 className="font-bold text-slate-800 text-base" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>ভাই ভাই রয়্যাল সমিতি</h2>
    <p className="text-xs text-slate-400 mt-1" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>{message}</p>
  </div>
);

export default LoadingScreen;
