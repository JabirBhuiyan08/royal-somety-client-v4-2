// client/src/pages/Wallet.jsx
import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import useAxios from '../hooks/useAxios';
import { useAuth } from '../providers/AuthProvider';
import { db } from '../utils/firebase';
import {
  collection, query, where, addDoc, deleteDoc, doc, onSnapshot, serverTimestamp
} from 'firebase/firestore';
import {
  Heart, Trash2, X, ChevronLeft, ChevronRight, Plus,
  Wallet as WalletIcon, MessageCircle, Bell, Phone,
  RefreshCw, Camera, AlertCircle, Image as ImageIcon, MessageSquare,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { bn } from 'date-fns/locale';
import { SOMITY_NAME } from '../utils/constants';
import DepositModal from '../components/DepositModal';
import useNotifications from '../hooks/useNotifications';

const BN_MONTHS = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'];

// Convert "1234" to "১২৩৪"
const toBnDigits = (input) => String(input ?? '').replace(/\d/g, d => '০১২৩৪৫৬৭৮৯'[d]);

// ==================== UI PRIMITIVES ====================

const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 ${className}`}>{children}</div>
);

// ==================== POST CARD ====================

const PhotoPost = ({ photo, onLike, onDelete, onImageClick, onProfileClick, isLiked, likesCount, currentUserId, isAdmin }) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const isOwner = String(photo.uploadedBy?._id) === String(currentUserId);
  const canDelete = isOwner || isAdmin;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-4">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-full overflow-hidden bg-gradient-to-br from-purple-300 to-pink-400 flex-shrink-0">
            {photo.uploadedBy?.avatar ? (
              <img src={photo.uploadedBy.avatar} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-sm font-bold text-white">
                {photo.uploadedBy?.name?.[0] || '?'}
              </div>
            )}
          </div>
          <div className="min-w-0 flex items-center gap-2">
            <p className="text-sm font-bold text-gray-900 truncate">{photo.uploadedBy?.name || 'সদস্য'}</p>
            <button
              onClick={() => onProfileClick?.(photo.uploadedBy?._id)}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex-shrink-0"
            >
              View Profile
            </button>
          </div>
        </div>
        {canDelete && (
          <button onClick={() => setShowDeleteConfirm(true)} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center flex-shrink-0">
            <Trash2 size={15} className="text-gray-400" />
          </button>
        )}
      </div>

      {/* Image */}
      <div className="aspect-square bg-gray-100 cursor-pointer" onClick={onImageClick}>
        <img src={photo.url} alt={photo.caption || ''} className="w-full h-full object-cover" />
      </div>

      {/* Actions */}
      <div className="px-3 py-2.5 flex items-center gap-4">
        <button
          onClick={() => onLike(photo._id, photo.uploadedBy?._id)}
          className="flex items-center gap-1.5 active:scale-95 transition-transform"
        >
          <Heart size={20} className={isLiked ? 'text-red-500 fill-red-500' : 'text-gray-700'} />
          <span className="text-sm font-semibold text-gray-700">{toBnDigits(likesCount)}</span>
        </button>
        <button className="flex items-center gap-1.5 text-gray-700 active:scale-95 transition-transform">
          <MessageSquare size={20} />
          <span className="text-sm font-semibold">{toBnDigits(0)}</span>
        </button>
      </div>

      {photo.caption && (
        <p className="text-sm text-gray-700 px-3 pb-3 leading-snug">
          <span className="font-semibold">{photo.uploadedBy?.name}</span> {photo.caption}
        </p>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowDeleteConfirm(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <Trash2 size={28} className="text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">ছবি মুছবেন?</h3>
              <p className="text-sm text-gray-500">মুছে ফেললে আর ফিরবে না।</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-700 font-semibold">না</button>
              <button onClick={() => onDelete(photo._id)} className="flex-1 py-3 rounded-xl bg-red-600 text-white font-semibold">হ্যাঁ, মুছুন</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ==================== MAIN COMPONENT ====================

const Wallet = () => {
  const { user, dbUser } = useAuth();
  const { unreadCount } = useNotifications();
  const axios = useAxios();
  const navigate = useNavigate();
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [lightboxIdx, setLightboxIdx] = useState(0);
  const [caption, setCaption] = useState('');
  const [preview, setPreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [photoLikes, setPhotoLikes] = useState({});
  const [likedPhotos, setLikedPhotos] = useState({});
  const fileRef = useRef(null);

  // ── Queries ──────────────────────────────────────────────────────────
  const monthlyQuery = useQuery({
    queryKey: ['monthly-status'],
    queryFn: () => axios.get('/member/monthly-status').then(r => r.data),
  });

  const targetsQuery = useQuery({
    queryKey: ['targets'],
    queryFn: () => axios.get('/member/targets').then(r => r.data.targets),
  });

  const photosQuery = useQuery({
    queryKey: ['gallery'],
    queryFn: () => axios.get('/member/gallery').then(r => r.data.photos),
  });

  const monthlyData = monthlyQuery.data;
  const targets = targetsQuery.data || [];
  const photos = photosQuery.data || [];
  const featuredTarget = targets[0];

  // ── Listen to likes ──────────────────────────────────────────────────
  useEffect(() => {
    if (!user || !photos.length) return;
    const unsubscribes = [];
    photos.forEach((photo) => {
      const likesQuery = query(collection(db, 'likes'), where('photoId', '==', photo._id));
      const unsubscribe = onSnapshot(likesQuery, (snap) => {
        const likes = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setPhotoLikes((prev) => ({ ...prev, [photo._id]: likes }));
        if (dbUser) {
          const userLiked = likes.some((l) => l.userId === dbUser._id);
          setLikedPhotos((prev) => ({ ...prev, [photo._id]: userLiked }));
        }
      });
      unsubscribes.push(unsubscribe);
    });
    return () => unsubscribes.forEach((unsub) => unsub());
  }, [photos, dbUser, user]);

  // ── Handlers ─────────────────────────────────────────────────────────
  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('photo', selectedFile);
      fd.append('caption', caption);
      await axios.post('/member/gallery', fd);
      toast.success('ছবি শেয়ার হয়েছে', { icon: '📸' });
      photosQuery.refetch();
      setSelectedFile(null);
      setPreview(null);
      setCaption('');
    } catch (err) {
      console.error('[Wallet] Photo upload failed:', err);
      toast.error(err?.response?.data?.message || 'শেয়ার করতে ব্যর্থ');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const deletePhoto = async (id) => {
    try {
      await axios.delete(`/member/gallery/${id}`);
      toast.success('ছবি মুছে ফেলা হয়েছে');
      photosQuery.refetch();
      setSelectedPhoto(null);
    } catch {
      toast.error('মুছতে ব্যর্থ');
    }
  };

  const toggleLike = async (photoId) => {
    if (!user || !dbUser) return;
    const likes = photoLikes[photoId] || [];
    const existingLike = likes.find((l) => l.userId === dbUser._id);
    try {
      if (existingLike) {
        await deleteDoc(doc(db, 'likes', existingLike.id));
        setLikedPhotos((prev) => ({ ...prev, [photoId]: false }));
      } else {
        await addDoc(collection(db, 'likes'), {
          photoId, userId: dbUser._id, userName: dbUser.name, userAvatar: dbUser.avatar, createdAt: serverTimestamp(),
        });
        setLikedPhotos((prev) => ({ ...prev, [photoId]: true }));
      }
    } catch (err) {
      console.error(err);
      toast.error('পছন্দ করতে ব্যর্থ');
    }
  };

  const openLightbox = (photo, idx) => {
    setLightboxIdx(idx);
    setSelectedPhoto(photo);
  };

  const handleFilePick = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith('image/')) {
      toast.error('শুধু ছবি আপলোড করা যাবে');
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      toast.error('ছবির আকার ৫ এমবি-এর কম হতে হবে');
      return;
    }
    setSelectedFile(f);
    setPreview(URL.createObjectURL(f));
  };

  // ── Derived data ─────────────────────────────────────────────────────
  const unpaidMonths = monthlyData
    ? Object.entries(monthlyData.months)
      .filter(([key, info]) => info.status === 'unpaid' && new Date(`${key.split('-')[0]}-${key.split('-')[1]}-01`) <= new Date())
      .map(([key]) => BN_MONTHS[parseInt(key.split('-')[1]) - 1])
    : [];
  const paidCount = monthlyData ? Object.values(monthlyData.months).filter(v => v.status === 'approved').length : 0;
  const pendingCount = monthlyData ? Object.values(monthlyData.months).filter(v => v.status === 'pending').length : 0;
  const dueCount = unpaidMonths.length;
  const balance = dbUser?.balance || 0;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* ══════════════════ TOP BAR ══════════════════ */}
      <div
        className="relative pt-5 pb-32 px-4 sm:px-6"
        style={{
          background: 'linear-gradient(135deg, #6d28d9 0%, #8b5cf6 40%, #ec4899 100%)',
        }}
      >
        {/* Decorative blobs */}
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-20 pointer-events-none"
             style={{ background: 'radial-gradient(circle, #fff, transparent)' }} />
        <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full opacity-10 pointer-events-none"
             style={{ background: 'radial-gradient(circle, #fbbf24, transparent)' }} />

        <div className="relative w-full max-w-[480px] mx-auto">
          {/* Title row */}
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2 mb-5">
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/chat')}
                className="w-9 h-9 rounded-full bg-white/95 text-gray-700 flex items-center justify-center shadow-sm active:scale-95 transition-transform"
                aria-label="চ্যাট"
              >
                <MessageCircle size={16} />
              </button>
              <button
                onClick={() => navigate('/notifications')}
                className="w-9 h-9 rounded-full bg-white/95 text-gray-700 flex items-center justify-center shadow-sm active:scale-95 transition-transform relative"
                aria-label="নোটিফিকেশন"
              >
                <Bell size={16} />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center px-1">
                    {unreadCount > 9 ? '৯+' : toBnDigits(unreadCount)}
                  </span>
                )}
              </button>
            </div>
            <h1 className="text-xs sm:text-sm font-bold text-pink-200 tracking-wide truncate text-center min-w-0">
              {SOMITY_NAME}
            </h1>
            <div className="w-9" aria-hidden="true" />
          </div>

          {/* Balance pill */}
          <div className="text-center">
            <p className="text-pink-100 text-xs font-semibold mb-2">আমার জমা</p>
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white shadow-lg max-w-full">
              <WalletIcon size={16} className="text-purple-600 flex-shrink-0" />
              <span className="text-base font-bold text-purple-700 tracking-tight truncate">
                {toBnDigits(balance.toLocaleString('en-US'))} ৳
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════ USER CARD (overlapping) ══════════════════ */}
      <div className="-mt-20 relative z-10 space-y-3 w-full max-w-[480px] mx-auto">
        <Card className="p-4 relative overflow-hidden">
          <div className={`flex items-center gap-3 ${dbUser?.bloodGroup ? 'pr-16' : ''}`}>
            {/* Avatar */}
            <button
              onClick={() => navigate('/profile')}
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden ring-2 ring-white shadow-md flex-shrink-0 bg-gradient-to-br from-purple-300 to-pink-400"
            >
              {dbUser?.avatar ? (
                <img src={dbUser.avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xl font-bold text-white">
                  {dbUser?.name?.[0]?.toUpperCase() || '?'}
                </div>
              )}
            </button>

            {/* Name + Number + emergency */}
            <div className="flex-1 min-w-0">
              <h2 className="text-sm sm:text-base font-extrabold text-gray-900 truncate uppercase">
                {dbUser?.name || 'সদস্য'}
              </h2>
              {(() => {
                const numbers = (dbUser?.email || '').replace(/\D/g, '');
                return numbers ? (
                  <p className="text-xs font-mono text-gray-500 truncate mt-0.5">{numbers}</p>
                ) : null;
              })()}
              <button
                onClick={() => navigate('/emergency')}
                className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 border border-green-200 text-green-700 text-[10px] font-bold active:scale-95 max-w-full"
              >
                <Phone size={10} className="fill-green-700 flex-shrink-0" />
                <span className="truncate">জরুরি যোগাযোগ</span>
              </button>
            </div>
          </div>

          {/* Blood drop badge */}
          {dbUser?.bloodGroup && (
            <div className="absolute px-4 -top-1 right-1 sm:-top-2 sm:-right-2 flex flex-col items-center pointer-events-none">
              <div className="relative">
                <svg width="50" height="60" viewBox="0 0 60 72" className="drop-shadow-lg sm:hidden">
                  <path
                    d="M30 4 C30 4, 8 30, 8 46 C8 58, 18 68, 30 68 C42 68, 52 58, 52 46 C52 30, 30 4, 30 4 Z"
                    fill="url(#bloodGrad)"
                  />
                  <defs>
                    <linearGradient id="bloodGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f87171" />
                      <stop offset="100%" stopColor="#dc2626" />
                    </linearGradient>
                  </defs>
                </svg>
                <svg width="50" height="70" viewBox="0 0 60 72" className="drop-shadow-lg hidden sm:block">
                  <path
                    d="M30 4 C30 4, 8 30, 8 46 C8 58, 18 68, 30 68 C42 68, 52 58, 52 46 C52 30, 30 4, 30 4 Z"
                    fill="url(#bloodGradLg)"
                  />
                  <defs>
                    <linearGradient id="bloodGradLg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f87171" />
                      <stop offset="100%" stopColor="#dc2626" />
                    </linearGradient>
                  </defs>
                </svg>
                <Plus
                  size={18}
                  strokeWidth={3}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white sm:hidden"
                  style={{ marginTop: 3 }}
                />
                <Plus
                  size={20}
                  strokeWidth={3}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white hidden sm:block"
                  style={{ marginTop: 4 }}
                />
              </div>
              <span className="mt-0.5 px-1.5 py-0.5 rounded-full bg-white border border-red-300 text-red-600 text-[9px] sm:text-[10px] font-bold whitespace-nowrap">
                {dbUser.bloodGroup} Positive
              </span>
            </div>
          )}
        </Card>

        {/* ══════════════════ GOAL BANNER ══════════════════ */}
        {featuredTarget && (
          <Card className="px-3 sm:px-4 py-3 flex items-center gap-2">
            <p className="text-xs sm:text-sm font-bold text-gray-800 flex-shrink-0">সমিতির লক্ষ্যমাত্রা -</p>
            <p className="text-xs sm:text-sm font-extrabold text-gray-900 flex-1 text-center truncate min-w-0">
              {featuredTarget.title}
            </p>
            <button
              onClick={() => navigate('/profile')}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 active:scale-95 flex-shrink-0"
            >
              বিস্তারিত
            </button>
          </Card>
        )}

        {/* ══════════════════ MONTHLY PROGRESS ══════════════════ */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2 gap-2">
            <p className="text-sm font-semibold text-gray-700 truncate">জমার অগ্রগতি</p>
            <p className="text-sm font-bold text-gray-800 flex-shrink-0">{toBnDigits(paidCount)}/১২ মাস</p>
          </div>
          <div className="w-full h-2 rounded-full bg-gray-200 overflow-hidden mb-3">
            <div
              className="h-2 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all"
              style={{ width: `${(paidCount / 12) * 100}%` }}
            />
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            <span className="px-2 py-1 rounded-full bg-purple-50 border border-purple-100 text-purple-700 text-[10px] sm:text-[11px] font-semibold text-center truncate">
              পরিশোধ {toBnDigits(paidCount)}
            </span>
            <span className="px-2 py-1 rounded-full bg-amber-50 border border-amber-100 text-amber-700 text-[10px] sm:text-[11px] font-semibold text-center truncate">
              অপেক্ষমাণ {toBnDigits(pendingCount)}
            </span>
            <span className="px-2 py-1 rounded-full bg-rose-50 border border-rose-100 text-rose-700 text-[10px] sm:text-[11px] font-semibold text-center truncate">
              বকেয়া {toBnDigits(dueCount)}
            </span>
          </div>
        </Card>

        {/* ══════════════════ POSTS FEED ══════════════════ */}
        <div className="pt-2">
          {photosQuery.isLoading ? (
            <div className="space-y-3">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                  <div className="h-12 bg-gray-50" />
                  <div className="aspect-square bg-gray-100 animate-pulse" />
                  <div className="h-12 bg-gray-50" />
                </div>
              ))}
            </div>
          ) : photosQuery.isError ? (
            <Card className="p-4 flex items-center gap-2 text-rose-600 text-sm flex-wrap">
              <AlertCircle size={16} className="flex-shrink-0" />
              <span className="flex-1 min-w-0 truncate">ছবি লোড করা যায়নি</span>
              <button onClick={() => photosQuery.refetch()} className="flex items-center gap-1 text-blue-600 font-semibold flex-shrink-0">
                <RefreshCw size={12} /> আবার
              </button>
            </Card>
          ) : photos.length === 0 ? (
            <Card className="p-8 text-center">
              <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-500 flex items-center justify-center mx-auto mb-3">
                <ImageIcon size={24} />
              </div>
              <p className="text-sm font-semibold text-gray-700">কোনো ছবি নেই</p>
              <p className="text-xs text-gray-400 mt-1">প্রথম ছবিটি শেয়ার করুন</p>
            </Card>
          ) : (
            photos.map((photo, idx) => (
              <PhotoPost
                key={photo._id}
                photo={photo}
                onLike={toggleLike}
                onDelete={deletePhoto}
                onImageClick={() => openLightbox(photo, idx)}
                onProfileClick={() => navigate('/profile')}
                isLiked={likedPhotos[photo._id] || false}
                likesCount={photoLikes[photo._id]?.length || 0}
                currentUserId={dbUser?._id}
                isAdmin={dbUser?.role === 'admin'}
              />
            ))
          )}
        </div>
      </div>

      {/* ══════════════════ FLOATING UPLOAD BUTTON ══════════════════ */}
      <div className="fixed inset-x-0 bottom-24 pointer-events-none z-30">
        <div className="w-full max-w-[480px] mx-auto px-4 sm:px-6 flex justify-end">
          <button
            onClick={() => fileRef.current?.click()}
            className="pointer-events-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-xl shadow-blue-500/40 flex items-center justify-center active:scale-95 transition-transform"
            aria-label="নতুন ছবি শেয়ার করুন"
          >
            <div className="relative">
              <Camera size={22} />
              <Plus size={11} strokeWidth={3} className="absolute -top-1 -right-1.5 bg-white text-blue-600 rounded-full" />
            </div>
          </button>
        </div>
      </div>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFilePick} />

      {/* ══════════════════ UPLOAD MODAL ══════════════════ */}
      {preview && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-gray-800">
            <button onClick={() => { setSelectedFile(null); setPreview(null); }} className="text-white">
              <X size={24} />
            </button>
            <span className="text-white font-semibold">নতুন পোস্ট</span>
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="text-blue-400 font-semibold disabled:opacity-50"
            >
              {uploading ? 'শেয়ার হচ্ছে...' : 'শেয়ার'}
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center p-4">
            <img src={preview} alt="preview" className="max-w-full max-h-[70vh] object-contain rounded-lg" />
          </div>
          <div className="p-4 bg-gray-900">
            <textarea
              value={caption}
              onChange={e => setCaption(e.target.value)}
              placeholder="ক্যাপশন লিখুন..."
              className="w-full px-4 py-3 rounded-xl bg-gray-800 text-white placeholder-gray-400 outline-none resize-none border border-gray-700 focus:border-blue-500"
              rows={3}
            />
          </div>
        </div>
      )}

      {/* ══════════════════ LIGHTBOX ══════════════════ */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
          <div className="flex items-center justify-between p-4">
            <button onClick={() => setSelectedPhoto(null)} className="text-white">
              <X size={24} />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-700">
                {selectedPhoto.uploadedBy?.avatar ? (
                  <img src={selectedPhoto.uploadedBy.avatar} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white">
                    {selectedPhoto.uploadedBy?.name?.[0] || '?'}
                  </div>
                )}
              </div>
              <span className="text-white text-sm">{selectedPhoto.uploadedBy?.name}</span>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <img src={selectedPhoto.url} alt="" className="max-w-full max-h-[70vh] object-contain" />
          </div>
          <div className="p-4 bg-black/60">
            <button onClick={() => toggleLike(selectedPhoto._id)} className="mb-2 active:scale-95">
              <Heart size={28} className={likedPhotos[selectedPhoto._id] ? 'text-red-500 fill-red-500' : 'text-white'} />
            </button>
            {photoLikes[selectedPhoto._id]?.length > 0 && (
              <p className="text-white text-sm font-semibold">{toBnDigits(photoLikes[selectedPhoto._id].length)} জন পছন্দ করেছেন</p>
            )}
            {selectedPhoto.caption && (
              <p className="text-white text-sm mt-2">
                <span className="font-semibold">{selectedPhoto.uploadedBy?.name}</span> {selectedPhoto.caption}
              </p>
            )}
          </div>
          <button
            className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            onClick={() => {
              const newIdx = (lightboxIdx - 1 + photos.length) % photos.length;
              setLightboxIdx(newIdx);
              setSelectedPhoto(photos[newIdx]);
            }}
            aria-label="পূর্ববর্তী"
          >
            <ChevronLeft size={24} className="text-white" />
          </button>
          <button
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            onClick={() => {
              const newIdx = (lightboxIdx + 1) % photos.length;
              setLightboxIdx(newIdx);
              setSelectedPhoto(photos[newIdx]);
            }}
            aria-label="পরবর্তী"
          >
            <ChevronRight size={24} className="text-white" />
          </button>
        </div>
      )}

      {showDepositModal && <DepositModal isOpen={showDepositModal} onClose={() => setShowDepositModal(false)} />}
    </div>
  );
};

export default Wallet;
