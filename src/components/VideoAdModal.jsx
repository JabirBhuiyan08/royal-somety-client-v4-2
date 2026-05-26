// client/src/components/VideoAdModal.jsx
import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const VIDEO_EMBED_URL = 'https://drive.google.com/file/d/1rh69XwpJJX4vVLSQA89Fpuyob1PMi2LD/preview?autoplay=1';
const AD_FLAG_KEY = 'show_video_ad';

const VideoAdModal = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Only show if the login page set the flag
    const shouldShow = sessionStorage.getItem(AD_FLAG_KEY);
    if (shouldShow === 'true') {
      // Small delay to ensure page is rendered first
      const timer = setTimeout(() => {
        setShow(true);
      }, 500);
      // Remove the flag immediately so it won't show again on refresh/navigation
      sessionStorage.removeItem(AD_FLAG_KEY);
      return () => clearTimeout(timer);
    }
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4">
      {/* Close button */}
      <button
        onClick={() => setShow(false)}
        className="absolute top-4 right-4 z-[101] w-10 h-10 rounded-full bg-white hover:bg-gray-100 text-gray-800 flex items-center justify-center shadow-lg transition-all active:scale-95"
        aria-label="বন্ধ করুন"
      >
        <X size={22} strokeWidth={2.5} />
      </button>

      {/* Video container */}
      <div className="w-full max-w-lg aspect-[9/16] sm:aspect-video rounded-2xl overflow-hidden shadow-2xl bg-black">
        <iframe
          src={VIDEO_EMBED_URL}
          className="w-full h-full border-0"
          allow="autoplay; encrypted-media; fullscreen"
          allowFullScreen
          title="Ad Video"
        />
      </div>
    </div>
  );
};

export default VideoAdModal;
