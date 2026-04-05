// client/src/components/LoadingScreen.jsx
const LoadingScreen = ({ message = 'লোড হচ্ছে...' }) => (
  <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-white">
    <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center text-3xl mb-5 shadow-lg">👑</div>
    <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4" style={{ borderWidth: 3 }} />
    <h2 className="font-bold text-slate-800 text-base" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>খানবাড়ি ভাই ভাই</h2>
    <p className="text-xs text-slate-400 mt-1" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>{message}</p>
  </div>
);

export default LoadingScreen;
