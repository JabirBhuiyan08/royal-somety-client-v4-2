// client/src/components/VideoAdModal.jsx
import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import EidGif from '../../assets/eid.gif';

const VideoAdModal = () => {
  const [show, setShow] = useState(true);

  // Fire confetti when modal shows
  useEffect(() => {
    if (!show) return;

    let cancelled = false;

    const fireConfetti = async () => {
      try {
        const confettiModule = await import('canvas-confetti');
        const confetti = confettiModule.default;

        if (cancelled) return;

        // First burst - left side
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { x: 0.2, y: 0.6 },
          colors: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96E6A1', '#DDA0DD'],
          zIndex: 9999,
        });
        // Second burst - right side
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { x: 0.8, y: 0.6 },
          colors: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96E6A1', '#DDA0DD'],
          zIndex: 9999,
        });
        // Stars from top
        confetti({
          particleCount: 30,
          spread: 120,
          origin: { x: 0.5, y: 0 },
          shapes: ['star'],
          colors: ['#FFD700', '#FFA500', '#FF4500'],
          scalar: 1.5,
          zIndex: 9999,
        });

        // Continuous celebration
        const duration = 3000;
        const end = Date.now() + duration;
        const interval = setInterval(() => {
          if (Date.now() > end || cancelled) {
            clearInterval(interval);
            return;
          }
          confetti({
            particleCount: 15,
            spread: 60,
            origin: { x: Math.random(), y: Math.random() * 0.4 },
            colors: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96E6A1', '#FFA500'],
            zIndex: 9999,
          });
        }, 400);
      } catch (err) {
        console.warn('Confetti failed to load:', err);
      }
    };

    // Small delay to ensure DOM is ready
    const timer = setTimeout(fireConfetti, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [show]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[9998] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      {/* Festive sparkle decorations */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-10 left-10 w-3 h-3 bg-yellow-400 rounded-full animate-ping opacity-75" />
        <div className="absolute top-20 right-16 w-2 h-2 bg-pink-400 rounded-full animate-ping opacity-75" style={{ animationDelay: '0.5s' }} />
        <div className="absolute bottom-32 left-20 w-2.5 h-2.5 bg-green-400 rounded-full animate-ping opacity-75" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-20 right-10 w-3 h-3 bg-purple-400 rounded-full animate-ping opacity-75" style={{ animationDelay: '0.3s' }} />
        <div className="absolute top-1/3 left-6 w-2 h-2 bg-orange-400 rounded-full animate-ping opacity-75" style={{ animationDelay: '0.7s' }} />
        <div className="absolute top-1/4 right-8 w-2.5 h-2.5 bg-cyan-400 rounded-full animate-ping opacity-75" style={{ animationDelay: '1.2s' }} />
      </div>

      {/* Close button */}
      <button
        onClick={() => setShow(false)}
        className="absolute top-4 right-4 z-[9999] w-10 h-10 rounded-full bg-white hover:bg-gray-100 text-gray-800 flex items-center justify-center shadow-lg transition-all active:scale-95"
        aria-label="বন্ধ করুন"
      >
        <X size={22} strokeWidth={2.5} />
      </button>

      {/* Ad container */}
      <div
        className="relative w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl border-4 border-yellow-400/50"
        style={{ animation: 'fadeInScale 0.4s ease-out' }}
      >
        {/* Festive header */}
        <div className="bg-gradient-to-r from-green-600 via-emerald-500 to-teal-500 px-4 py-2.5 text-center">
          <p className="text-white text-sm font-bold">🌙 ঈদ মোবারক 🌙</p>
        </div>

        {/* Eid GIF */}
        <img
          src={EidGif}
          alt="Eid Mubarak"
          className="w-full h-auto object-contain bg-white"
        />

        {/* Festive footer */}
        <div className="bg-gradient-to-r from-green-600 via-emerald-500 to-teal-500 px-4 py-2.5 text-center">
          <p className="text-white text-xs font-semibold">✨ ভাই ভাই রয়্যাল সমিতি পরিবারের পক্ষ থেকে শুভেচ্ছা ✨</p>
        </div>
      </div>
    </div>
  );
};

export default VideoAdModal;
