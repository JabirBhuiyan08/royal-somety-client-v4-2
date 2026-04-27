// client/src/pages/Wallet.jsx
import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import useAxios from '../hooks/useAxios';
import { useAuth } from '../providers/AuthProvider';
import { db } from '../utils/firebase';
import {
  collection, query, where, addDoc, deleteDoc, doc, onSnapshot, serverTimestamp
} from 'firebase/firestore';
import {
  Heart, Trash2, Camera, X, ChevronLeft, ChevronRight, Plus, ChevronDown,
  ArrowUpRight, ArrowDownLeft, Target, Eye, EyeOff, Wallet as WalletIcon,
  Calendar, Clock, CheckCircle, XCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { bn } from 'date-fns/locale';

const BN_MONTHS = ['জনুয়ারি','ফেব্রুয়ারি','মার্চ','এপ্রিল','মে','জুন','জুলাই','আগস্ট','সেপ্টেম্বর','অক্টোবর','নভেম্বর','ডিসেম্বর'];

const Wallet = () => {
  const { user, dbUser } = useAuth();
  const axios = useAxios();
  const navigate = useNavigate();
  const [showBalance, setShowBalance] = useState(true);
  const [expandedSection, setExpandedSection] = useState({ transactions: false, targets: false });

  // ── Gallery state ──────────────────────────────────────────────────────
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [lightboxIdx, setLightboxIdx] = useState(0);
  const [caption, setCaption] = useState('');
  const [preview, setPreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [photoLikes, setPhotoLikes] = useState({});
  const [likedPhotos, setLikedPhotos] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const fileRef = useRef(null);

  // ── Wallet queries ──────────────────────────────────────────────────────
  const { data: transactions = [], isLoading: txLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => axios.get('/member/transactions').then(r => r.data.transactions),
  });

  const { data: targets = [] } = useQuery({
    queryKey: ['targets'],
    queryFn: () => axios.get('/member/targets').then(r => r.data.targets),
  });

  const { data: monthlyData } = useQuery({
    queryKey: ['monthly-status'],
    queryFn: () => axios.get('/member/monthly-status').then(r => r.data),
  });

  // ── Gallery data ───────────────────────────────────────────────────────
  const { data: photos = [], isLoading: photosLoading, refetch: refetchGallery } = useQuery({
    queryKey: ['gallery'],
    queryFn: () => axios.get('/member/gallery').then(r => r.data.photos),
  });

  // Listen to likes for all photos
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

  // ── Helpers ────────────────────────────────────────────────────────────
  const getPhoneFromEmail = () => {
    const email = user?.email;
    if (!email) return '';
    return email.split('@')[0].replace(/^\+88/, '0');
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved': return { bg: 'bg-green-100', text: 'text-green-700', label: 'অনুমোদিত', icon: <CheckCircle size={12} /> };
      case 'pending': return { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'অপেক্ষমাণ', icon: <Clock size={12} /> };
      default: return { bg: 'bg-red-100', text: 'text-red-700', label: 'বাতিল', icon: <XCircle size={12} /> };
    }
  };

  // ── Gallery handlers ───────────────────────────────────────────────────
  const openLightbox = (photo, idx) => { setLightboxIdx(idx); setSelectedPhoto(photo); };
  const closeLightbox = () => setSelectedPhoto(null);

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setSelectedFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('photo', selectedFile);
      fd.append('caption', caption);
      await axios.post('/member/gallery', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('ছবি শেয়ার করা হয়েছে 📸');
      refetchGallery();
      setSelectedFile(null);
      setPreview(null);
      setCaption('');
    } catch {
      toast.error('শেয়ার করতে ব্যর্থ');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const deleteMutation = useMutation({
    mutationFn: (id) => axios.delete(`/member/gallery/${id}`),
    onSuccess: () => {
      toast.success('পোস্ট মুছে ফেলা হয়েছে');
      refetchGallery();
      setSelectedPhoto(null);
    },
    onError: () => toast.error('মুছতে ব্যর্থ'),
  });

  const toggleLike = async (photoId, photoOwnerId) => {
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

        if (photoOwnerId && photoOwnerId !== dbUser._id) {
          try {
            const token = localStorage.getItem('token');
            await axios.post('/member/notifications', {
              type: 'gallery_like', title: 'কেউ আপনার ছবি পছন্দ করেছে',
              message: `${dbUser.name} আপনার ছবি পছন্দ করেছেন ❤️`, photoId, targetUserId: photoOwnerId,
            }, { headers: { Authorization: `Bearer ${token}` } });
          } catch (e) { console.error('Notification error:', e); }
        }
      }
    } catch (err) {
      console.error(err);
      toast.error('পছন্দ করতে ব্যর্থ');
    }
  };

  const getLikes = (photoId) => photoLikes[photoId] || [];
  const isLiked = (photoId) => likedPhotos[photoId] || false;

  const formatLikesText = (photoId) => {
    const likes = getLikes(photoId);
    const count = likes.length;
    if (count === 0) return '';
    if (count === 1) {
      if (isLiked(photoId)) return 'আপনি';
      return likes[0].userName;
    }
    if (count === 2) {
      if (isLiked(photoId)) {
        const other = likes.find((l) => l.userId !== dbUser?._id);
        return `আপনি এবং ${other?.userName}`;
      }
      return `${likes[0].userName} এবং ${likes[1].userName}`;
    }
    if (isLiked(photoId)) return `আপনি এবং আর ${count - 1} জন`;
    return `${likes[0].userName} এবং আর ${count - 1} জন`;
  };

  const getLikeCountText = (photoId) => {
    const count = getLikes(photoId).length;
    if (count === 0) return '';
    if (count === 1) return '১ জন';
    return `${count} জন`;
  };

  const formatTime = (date) => {
    if (!date) return '';
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true, locale: bn });
    } catch {
      return '';
    }
  };

  // ── Payment progress helper ────────────────────────────────────────────
  const unpaidMonths = monthlyData
    ? Object.entries(monthlyData.months)
        .filter(([key, info]) => info.status === 'unpaid' && new Date(`${key.split('-')[0]}-${key.split('-')[1]}-01`) <= new Date())
        .map(([key]) => BN_MONTHS[parseInt(key.split('-')[1]) - 1])
    : [];

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="pb-24">
      {/* ── Profile Header ──────────────────────────────────────────────── */}
      <div className="relative mb-3">
        <div className="h-28 bg-gradient-to-r from-blue-500 to-indigo-600 relative overflow-hidden">
          {dbUser?.coverPhoto && (
            <img src={dbUser.coverPhoto} alt="" className="w-full h-full object-cover" />
          )}
        </div>
        <div className="mx-3 -mt-12">
          <div className="bg-white rounded-2xl pt-14 pb-3 px-3 shadow-lg border border-gray-100">
            <div className="flex items-end gap-3">
              <div className="relative">
                <div className="w-16 h-16 rounded-xl overflow-hidden ring-4 ring-white shadow-md bg-gradient-to-br from-blue-100 to-indigo-100">
                  {dbUser?.avatar ? (
                    <img src={dbUser.avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl font-bold bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                      {dbUser?.name?.[0] || '?'}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-bold text-gray-800 text-base truncate">{dbUser?.name || '...'}</h2>
                <p className="text-xs text-blue-600 font-medium">{getPhoneFromEmail()}</p>
                <p className="text-xs text-gray-500 font-mono">ID: {dbUser?.memberId || '—'}</p>
                {dbUser?.role === 'admin' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 mt-1.5">
                    👑 অ্যাডমিন
                  </span>
                )}
              </div>
              <button
                onClick={() => navigate('/profile')}
                className="flex items-center gap-1 px-3 py-2 rounded-lg bg-gray-100 text-gray-700 text-xs font-semibold hover:bg-gray-200 transition-all active:scale-95 flex-shrink-0 self-start"
              >
                প্রোফাইল <ChevronRight size={12} />
              </button>
            </div>

            {/* Balance & Deposit */}
            <div className="mt-4 pt-3 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 mb-0.5 flex items-center gap-1">
                    <WalletIcon size={12} /> মোট ব্যালেন্স
                  </p>
                  <p className="text-xl font-bold text-gray-800">
                    ৳{(dbUser?.balance || 0).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => setShowBalance(!showBalance)}
                  className="text-blue-600 hover:text-blue-700 flex items-center gap-1 text-xs font-medium"
                >
                  {showBalance ? <EyeOff size={14} /> : <Eye size={14} />}
                  {showBalance ? 'লুকআও' : 'দেখুন'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Content ─────────────────────────────────────────────────── */}
      <div className="px-3 space-y-3 pb-24">

        {/* ── Payment Progress Card ────────────────────────────────────── */}
        {monthlyData && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-blue-500" />
                <p className="text-sm font-bold text-gray-800">মাসিক পেমেন্ট স্ট্যাটাস</p>
              </div>
              <span className="text-sm font-bold text-green-600">
                {Object.values(monthlyData.months).filter(v => v.status === 'approved').length}/12 পরিশোধিত
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
              <div
                className="bg-green-500 h-2 rounded-full transition-all"
                style={{
                  width: `${(Object.values(monthlyData.months).filter(v => v.status === 'approved').length / 12) * 100}%`
                }}
              />
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="bg-green-50 rounded-xl p-2.5 text-center">
                <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 mb-1">
                  <CheckCircle size={12} className="text-green-600" />
                </div>
                <p className="text-lg font-bold text-green-700">
                  {Object.values(monthlyData.months).filter(v => v.status === 'approved').length}
                </p>
                <p className="text-xs text-gray-500">পরিশোধিত</p>
              </div>
              <div className="bg-yellow-50 rounded-xl p-2.5 text-center">
                <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-yellow-100 mb-1">
                  <Clock size={12} className="text-yellow-600" />
                </div>
                <p className="text-lg font-bold text-yellow-700">
                  {Object.values(monthlyData.months).filter(v => v.status === 'pending').length}
                </p>
                <p className="text-xs text-gray-500">অপেক্ষমাণ</p>
              </div>
              <div className="bg-red-50 rounded-xl p-2.5 text-center">
                <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-100 mb-1">
                  <XCircle size={12} className="text-red-600" />
                </div>
                <p className="text-lg font-bold text-red-700">
                  {Object.values(monthlyData.months).filter(v => v.status === 'unpaid' && new Date(`${v.month}-01`) <= new Date()).length}
                </p>
                <p className="text-xs text-gray-500">বকেয়া</p>
              </div>
            </div>

            {/* Due months alert */}
            {unpaidMonths.length > 0 && (
              <div className="bg-red-50 rounded-xl p-3 border border-red-100">
                <div className="flex items-start gap-2">
                  <XCircle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-red-700">
                      ⚠️ {unpaidMonths.length} মাসের বকেয়া রয়েছে
                    </p>
                    <p className="text-xs text-red-600 mt-0.5">
                      {unpaidMonths.join(', ')}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Transactions Card (Collapsible) ───────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <button
            onClick={() => setExpandedSection(prev => ({ ...prev, transactions: !prev.transactions }))}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 active:bg-gray-100 transition-all"
          >
            <h3 className="text-sm font-bold text-gray-800">সাম্প্রতিক লেনদেন</h3>
            <ChevronDown
              size={18}
              className={`text-gray-500 transition-transform ${expandedSection.transactions ? 'rotate-180' : ''}`}
            />
          </button>

          {expandedSection.transactions && (
            <div className="px-4 pb-4 border-t border-gray-100">
              {txLoading ? (
                <div className="flex justify-center py-8">
                  <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400 text-sm">কোনো লেনদেন নেই</p>
                </div>
              ) : (
                <div className="space-y-2 mt-3">
                  {transactions.slice(0, 5).map(tx => {
                    const status = getStatusBadge(tx.status);
                    const isDeposit = tx.type === 'deposit';
                    return (
                      <div key={tx._id} className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-xl">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDeposit ? 'bg-green-100' : 'bg-red-100'}`}>
                          {isDeposit ? <ArrowDownLeft size={18} className="text-green-600" /> : <ArrowUpRight size={18} className="text-red-500" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800">{isDeposit ? 'জমা' : 'উত্তোলন'}</p>
                          <p className="text-xs text-gray-400">{new Date(tx.createdAt).toLocaleDateString('bn-BD')}</p>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-bold ${isDeposit ? 'text-green-600' : 'text-red-600'}`}>
                            {isDeposit ? '+' : '-'}৳{tx.amount?.toLocaleString()}
                          </p>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${status.bg} ${status.text}`}>
                            {status.icon} {status.label}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Targets Card (Collapsible) ─────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <button
            onClick={() => setExpandedSection(prev => ({ ...prev, targets: !prev.targets }))}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 active:bg-gray-100 transition-all"
          >
            <h3 className="text-sm font-bold text-gray-800">লক্ষ্যমাত্রা</h3>
            <div className="flex items-center gap-2">
              {targets.length > 0 && (
                <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                  {targets.length}
                </span>
              )}
              <ChevronDown
                size={18}
                className={`text-gray-500 transition-transform ${expandedSection.targets ? 'rotate-180' : ''}`}
              />
            </div>
          </button>

          {expandedSection.targets && (
            <div className="px-4 pb-4 border-t border-gray-100">
              {targets.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400 text-sm">কোনো লক্ষ্য নেই</p>
                </div>
              ) : (
                <div className="space-y-3 mt-3">
                  {targets.slice(0, 3).map(t => {
                    const pct = Math.min(Math.round((t.collected / t.goal) * 100), 100);
                    const isHigh = pct >= 60;
                    return (
                      <div key={t._id} className="p-3 bg-gray-50 rounded-xl">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="text-sm font-bold text-gray-800">{t.title}</p>
                            <p className="text-xs text-gray-500">{t.category}</p>
                          </div>
                          <span className={`text-sm font-bold ${isHigh ? 'text-green-600' : 'text-orange-600'}`}>{pct}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                          <div className={`h-2 rounded-full transition-all ${isHigh ? 'bg-green-500' : 'bg-orange-500'}`} style={{ width: `${pct}%` }} />
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-semibold text-green-600">৳{t.collected?.toLocaleString()}</span>
                          <span className="text-gray-400">লক্ষ্য: ৳{t.goal?.toLocaleString()}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

      

        {/* ── Gallery Feed ─────────────────────────────────────────────── */}
        <div className="space-y-4">
          {photosLoading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl overflow-hidden animate-pulse">
                <div className="flex items-center justify-between p-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gray-200" />
                    <div className="h-4 bg-gray-200 rounded w-24" />
                  </div>
                </div>
                <div className="aspect-square bg-gray-200" />
                <div className="p-3 space-y-2">
                  <div className="h-8 bg-gray-200 rounded w-32" />
                  <div className="h-3 bg-gray-200 rounded w-full" />
                  <div className="h-3 bg-gray-200 rounded w-3/4" />
                </div>
              </div>
            ))
          ) : photos.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
              <Camera size={48} className="text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">কোনো ছবি নেই</p>
              <button
                onClick={() => fileRef.current?.click()}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold"
              >
                প্রথম ছবি যোগ করুন
              </button>
            </div>
          ) : (
            photos.map((photo, idx) => (
              <article key={photo._id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-gray-100">
                      {photo.uploadedBy?.avatar ? (
                        <img src={photo.uploadedBy.avatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                          <Camera size={14} className="text-gray-400" />
                        </div>
                      )}
                    </div>
                    <span className="text-sm font-semibold text-gray-800">
                      {photo.uploadedBy?.name || 'সদস্য'}
                    </span>
                  </div>
                  
                  {(String(photo.uploadedBy?._id) === String(dbUser?._id) || dbUser?.role === 'admin') && (
                    <button 
                      onClick={() => setDeleteConfirm(photo)} 
                      className="p-1.5 hover:bg-gray-100 rounded-lg active:scale-95 transition-all"
                    >
                      <Trash2 size={16} className="text-gray-500" />
                    </button>
                  )}
                </div>

                {/* Image */}
                <div 
                  className="relative aspect-square bg-gray-100 cursor-pointer"
                  onClick={() => openLightbox(photo, idx)}
                >
                  <img 
                    src={photo.url} 
                    alt={photo.caption || ''}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  {/* Double-tap heart overlay */}
                  {isLiked(photo._id) && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <Heart size={80} className="text-white/90 fill-red-500 drop-shadow-lg animate-pulse" />
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => toggleLike(photo._id, photo.uploadedBy?._id)}
                        className="active:scale-95 transition-transform"
                      >
                        <Heart 
                          size={24} 
                          className={isLiked(photo._id) 
                            ? 'text-red-500 fill-red-500' 
                            : 'text-gray-700'
                          }
                        />
                      </button>
                    </div>
                  </div>

                  {/* Likes */}
                  {getLikes(photo._id).length > 0 && (
                    <p className="text-sm font-semibold text-gray-900 mb-1">
                      {getLikeCountText(photo._id)} পছন্দ
                    </p>
                  )}

                  {/* Caption */}
                  {photo.caption && (
                    <div className="text-sm">
                      <span className="font-semibold mr-1">{photo.uploadedBy?.name}</span>
                      {photo.caption}
                    </div>
                  )}

                  {/* Timestamp */}
                  <p className="text-xs text-gray-400 mt-1 uppercase">
                    {formatTime(photo.createdAt)}
                  </p>
                </div>
              </article>
            ))
          )}
        </div>

        {/* ── Upload Preview Modal ──────────────────────────────────────── */}
        {preview && (
          <div className="fixed inset-0 z-50 bg-black flex flex-col animate-slideUp">
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
              <button onClick={() => { setSelectedFile(null); setPreview(null); }} className="text-white"><X size={24} /></button>
              <span className="text-white font-semibold">নতুন পোস্ট</span>
              <button onClick={handleUpload} disabled={uploading} className="text-blue-500 font-semibold disabled:opacity-50">
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
                className="w-full px-4 py-3 rounded-xl bg-gray-800 text-white placeholder-gray-400 border-0 outline-none resize-none"
                rows="3"
              />
            </div>
          </div>
        )}

        {/* ── Lightbox Modal ────────────────────────────────────────────── */}
        {selectedPhoto && (
          <div className="fixed inset-0 z-50 bg-black flex flex-col" onClick={closeLightbox}>
            <div className="flex items-center justify-between p-4 bg-black/50">
              <button onClick={closeLightbox} className="text-white"><X size={24} /></button>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-tr from-purple-500 to-pink-500 p-[2px]">
                  <div className="w-full h-full rounded-full overflow-hidden bg-black">
                    {selectedPhoto.uploadedBy?.avatar ? (
                      <img src={selectedPhoto.uploadedBy.avatar} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gray-800 flex items-center justify-center"><Camera size={14} className="text-gray-500" /></div>
                    )}
                  </div>
                </div>
                <span className="text-white font-semibold text-sm">{selectedPhoto.uploadedBy?.name || 'সদস্য'}</span>
              </div>
              {(String(selectedPhoto.uploadedBy?._id) === String(dbUser?._id) || dbUser?.role === 'admin') && (
                <button onClick={(e) => { e.stopPropagation(); setDeleteConfirm(selectedPhoto); }} className="text-white/70">
                  <Trash2 size={20} />
                </button>
              )}
            </div>
            <div className="flex-1 flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
              <img src={selectedPhoto.url} alt="" className="max-w-full max-h-[70vh] object-contain" />
            </div>
            <button
              className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
              onClick={(e) => { e.stopPropagation(); const newIdx = (lightboxIdx - 1 + photos.length) % photos.length; setLightboxIdx(newIdx); setSelectedPhoto(photos[newIdx]); }}
            >
              <ChevronLeft size={24} className="text-white" />
            </button>
            <button
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
              onClick={(e) => { e.stopPropagation(); const newIdx = (lightboxIdx + 1) % photos.length; setLightboxIdx(newIdx); setSelectedPhoto(photos[newIdx]); }}
            >
              <ChevronRight size={24} className="text-white" />
            </button>
            <div className="bg-black/50 p-4 space-y-2">
              <div className="flex items-center gap-4">
                <button onClick={() => toggleLike(selectedPhoto._id, selectedPhoto.uploadedBy?._id)} className="flex items-center gap-1 active:scale-95 transition-all">
                  <Heart size={28} className={isLiked(selectedPhoto._id) ? 'text-red-500 fill-red-500' : 'text-white'} />
                </button>
              </div>
              {getLikes(selectedPhoto._id).length > 0 && (
                <div>
                  <p className="text-white font-semibold text-sm">{getLikeCountText(selectedPhoto._id)} পছন্দ</p>
                  <p className="text-white/70 text-xs">{formatLikesText(selectedPhoto._id)} পছন্দ করেছেন</p>
                </div>
              )}
              {selectedPhoto.caption && (
                <p className="text-white text-sm"><span className="font-semibold mr-2">{selectedPhoto.uploadedBy?.name}</span>{selectedPhoto.caption}</p>
              )}
              <p className="text-white/50 text-xs">{formatTime(selectedPhoto.createdAt)}</p>
            </div>
          </div>
        )}

        {/* ── Delete Confirmation ──────────────────────────────────────── */}
        {deleteConfirm && (
          <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm animate-scaleUp">
              <div className="text-center mb-6">
                <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                  <Trash2 size={28} className="text-red-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">মুছে ফেলবেন?</h3>
                <p className="text-sm text-gray-500">এই ছবি মুছে ফেললে পুনরায় ফিরে পাওয়া যাবে না।</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-3 rounded-xl font-semibold bg-gray-100 text-gray-700 active:scale-95 transition-all">বাতিল</button>
                <button onClick={() => { deleteMutation.mutate(deleteConfirm._id); setDeleteConfirm(null); }} className="flex-1 py-3 rounded-xl font-semibold bg-red-600 text-white active:scale-95 transition-all">মুছে ফেলুন</button>
              </div>
            </div>
          </div>
        )}

        {/* ── Upload FAB ───────────────────────────────────────────────── */}
        <button
          onClick={() => fileRef.current?.click()}
          className="fixed bottom-24 right-4 w-14 h-14 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg flex items-center justify-center active:scale-95 transition-all z-40"
          style={{ boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)' }}
        >
          <Plus size={28} />
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />

        {/* ── Animations ─────────────────────────────────────────────────── */}
        <style>{`
          @keyframes slideUp {
            from { transform: translateY(100%); }
            to { transform: translateY(0); }
          }
          @keyframes scaleUp {
            from { transform: scale(0.9); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
          }
          .animate-slideUp { animation: slideUp 0.3s ease-out; }
          .animate-scaleUp { animation: scaleUp 0.2s ease-out; }
        `}</style>
      </div>

    </div>
  );
};

export default Wallet;
