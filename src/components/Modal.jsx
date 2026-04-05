// client/src/components/Modal.jsx
import { useEffect } from 'react';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  // Close on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeMap = { sm: '320px', md: '440px', lg: '480px' };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <div
        className="w-full rounded-t-3xl overflow-hidden"
        style={{
          maxWidth: sizeMap[size],
          background: 'linear-gradient(180deg, #1e1e35, #16213e)',
          border: '1px solid rgba(226,185,111,0.2)',
          borderBottom: 'none',
          animation: 'slideUpModal 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ background: 'rgba(226,185,111,0.3)' }} />
        </div>

        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-5 py-3 border-b"
            style={{ borderColor: 'rgba(226,185,111,0.12)' }}>
            <h3 className="text-base font-semibold text-white"
              style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>
              {title}
            </h3>
            <button onClick={onClose}
              className="w-8 h-8 rounded-xl flex items-center justify-center transition-all active:scale-90"
              style={{ background: 'rgba(255,255,255,0.06)' }}>
              <X size={16} className="text-slate-400" />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="px-5 py-4 max-h-[80vh] overflow-y-auto">
          {children}
        </div>

        {/* iOS safe area */}
        <div style={{ height: 'env(safe-area-inset-bottom, 12px)' }} />
      </div>

      <style>{`
        @keyframes slideUpModal {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default Modal;
