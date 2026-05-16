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
  Heart, Trash2, Camera, X, ChevronLeft, ChevronRight, Plus,
  Eye, EyeOff, Wallet as WalletIcon, Calendar, Clock, CheckCircle, XCircle, Home
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { bn } from 'date-fns/locale';
import DepositModal from '../components/DepositModal';

const BN_MONTHS = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'];

// ==================== SIMPLE COMPONENTS ====================

const BigButton = ({ label, onClick, color = 'blue' }) => (
  <button
    onClick={onClick}
    className={`w-full py-4 rounded-xl text-base font-bold flex items-center justify-center gap-2 active:scale-95 ${
      color === 'blue' ? 'bg-blue-600 text-white' :
      color === 'green' ? 'bg-green-600 text-white' :
      'bg-gray-600 text-white'
    }`}
  >
    {label}
  </button>
);

const Section = ({ title, children, defaultOpen = true }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-gray-50"
      >
        <span className="text-base font-bold text-gray-800">{title}</span>
        <span className="text-2xl">{isOpen ? '−' : '+'}</span>
      </button>
      {isOpen && <div className="p-4">{children}</div>}
    </div>
  );
};

const StatBox = ({ label, value, color = 'blue' }) => (
  <div className={`bg-${color}-50 rounded-xl p-3 text-center`}>
    <p className="text-xl font-bold text-gray-800">{value}</p>
    <p className="text-xs text-gray-500 mt-1">{label}</p>
  </div>
);

const TransactionItem = ({ transaction }) => {
  const isDeposit = transaction.type === 'deposit';
  const date = new Date(transaction.createdAt).toLocaleDateString('bn-BD');
  
  let statusColor = 'gray';
  let statusText = '';
  if (transaction.status === 'approved') {
    statusColor = 'green';
    statusText = 'অনুমোদিত';
  } else if (transaction.status === 'pending') {
    statusColor = 'orange';
    statusText = 'অপেক্ষমাণ';
  } else {
    statusColor = 'red';
    statusText = 'বাতিল';
  }

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl mb-2">
      <div>
        <p className="text-sm font-semibold text-gray-800">
          {isDeposit ? 'জমা' : 'উত্তোলন'}
        </p>
        <p className="text-xs text-gray-400">{date}</p>
      </div>
      <div className="text-right">
        <p className={`text-base font-bold ${isDeposit ? 'text-green-600' : 'text-red-600'}`}>
          {isDeposit ? '+' : '-'}৳{transaction.amount?.toLocaleString()}
        </p>
        <p className={`text-xs mt-1 ${statusColor === 'green' ? 'text-green-600' : statusColor === 'orange' ? 'text-orange-600' : 'text-red-600'}`}>
          {statusText}
        </p>
      </div>
    </div>
  );
};

const TargetItem = ({ target }) => {
  const percentage = Math.min(Math.round((target.collected / target.goal) * 100), 100);
  const isHigh = percentage >= 60;
  
  return (
    <div className="mb-3 p-3 bg-gray-50 rounded-xl">
      <div className="flex justify-between mb-2">
        <span className="text-sm font-bold text-gray-800">{target.title}</span>
        <span className={`text-sm font-bold ${isHigh ? 'text-green-600' : 'text-orange-600'}`}>
          {percentage}%
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
        <div 
          className={`h-3 rounded-full ${isHigh ? 'bg-green-500' : 'bg-orange-500'}`} 
          style={{ width: `${percentage}%` }} 
        />
      </div>
      <div className="flex justify-between text-xs">
        <span className="font-semibold text-green-600">৳{target.collected?.toLocaleString()}</span>
        <span className="text-gray-400">লক্ষ্য: ৳{target.goal?.toLocaleString()}</span>
      </div>
    </div>
  );
};

const PhotoPost = ({ photo, onLike, onDelete, onImageClick, isLiked, likesCount, currentUserId, isAdmin }) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const timeAgo = photo.createdAt ? formatDistanceToNow(new Date(photo.createdAt), { addSuffix: true, locale: bn }) : '';
  const isOwner = String(photo.uploadedBy?._id) === String(currentUserId);
  const canDelete = isOwner || isAdmin;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-4">
      {/* Header */}
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200">
            {photo.uploadedBy?.avatar ? (
              <img src={photo.uploadedBy.avatar} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-lg font-bold text-gray-500">
                {photo.uploadedBy?.name?.[0] || '?'}
              </div>
            )}
          </div>
          <span className="text-sm font-semibold text-gray-800">{photo.uploadedBy?.name || 'সদস্য'}</span>
        </div>
        {canDelete && (
          <button onClick={() => setShowDeleteConfirm(true)} className="p-2">
            <Trash2 size={18} className="text-gray-400" />
          </button>
        )}
      </div>

      {/* Image */}
      <div className="aspect-square bg-gray-100 cursor-pointer" onClick={onImageClick}>
        <img src={photo.url} alt={photo.caption || ''} className="w-full h-full object-cover" />
      </div>

      {/* Actions */}
      <div className="p-3">
        <div className="flex items-center gap-3 mb-2">
          <button onClick={() => onLike(photo._id, photo.uploadedBy?._id)} className="active:scale-95">
            <Heart size={26} className={isLiked ? 'text-red-500 fill-red-500' : 'text-gray-600'} />
          </button>
        </div>

        {likesCount > 0 && (
          <p className="text-sm font-semibold text-gray-800 mb-1">
            {likesCount} জন পছন্দ করেছেন
          </p>
        )}

        {photo.caption && (
          <p className="text-sm text-gray-700 mb-1">
            <span className="font-semibold">{photo.uploadedBy?.name}</span> {photo.caption}
          </p>
        )}

        <p className="text-xs text-gray-400">{timeAgo}</p>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <Trash2 size={28} className="text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">ছবি মুছবেন?</h3>
              <p className="text-sm text-gray-500">মুছে ফেললে আর ফিরবে না।</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-700 font-semibold">
                না
              </button>
              <button onClick={() => onDelete(photo._id)} className="flex-1 py-3 rounded-xl bg-red-600 text-white font-semibold">
                হ্যাঁ, মুছুন
              </button>
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
  const axios = useAxios();
  const navigate = useNavigate();
  const [showBalance, setShowBalance] = useState(true);
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

  // Queries
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

  const { data: photos = [], isLoading: photosLoading, refetch: refetchGallery } = useQuery({
    queryKey: ['gallery'],
    queryFn: () => axios.get('/member/gallery').then(r => r.data.photos),
  });

  // Listen to likes
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

  // Handlers
  const getPhone = () => {
    const email = user?.email;
    if (!email) return '';
    return email.split('@')[0];
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('photo', selectedFile);
      fd.append('caption', caption);
      await axios.post('/member/gallery', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('ছবি শেয়ার হয়েছে');
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

  const deletePhoto = async (id) => {
    try {
      await axios.delete(`/member/gallery/${id}`);
      toast.success('ছবি মুছে ফেলা হয়েছে');
      refetchGallery();
      setSelectedPhoto(null);
    } catch {
      toast.error('মুছতে ব্যর্থ');
    }
  };

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

  const unpaidMonths = monthlyData
    ? Object.entries(monthlyData.months)
        .filter(([key, info]) => info.status === 'unpaid' && new Date(`${key.split('-')[0]}-${key.split('-')[1]}-01`) <= new Date())
        .map(([key]) => BN_MONTHS[parseInt(key.split('-')[1]) - 1])
    : [];

  const paidCount = monthlyData ? Object.values(monthlyData.months).filter(v => v.status === 'approved').length : 0;
  const pendingCount = monthlyData ? Object.values(monthlyData.months).filter(v => v.status === 'pending').length : 0;
  const dueCount = unpaidMonths.length;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Simple Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 pt-8 pb-4 px-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-blue-100 text-sm">আপনার ওয়ালেট</p>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-2xl font-bold text-white">
                {showBalance ? `৳${(dbUser?.balance || 0).toLocaleString()}` : '••••••'}
              </p>
              <button onClick={() => setShowBalance(!showBalance)} className="p-1">
                {showBalance ? <EyeOff size={18} className="text-blue-200" /> : <Eye size={18} className="text-blue-200" />}
              </button>
            </div>
          </div>
          <button onClick={() => navigate('/')} className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <Home size={20} className="text-white" />
          </button>
        </div>
      </div>

      {/* Profile Info */}
      <div className="px-4 -mt-6">
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full overflow-hidden bg-gradient-to-br from-blue-400 to-blue-600">
              {dbUser?.avatar ? (
                <img src={dbUser.avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xl font-bold text-white">
                  {dbUser?.name?.[0]?.toUpperCase() || '?'}
                </div>
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-base font-bold text-gray-800">{dbUser?.name || 'সদস্য'}</h2>
              <p className="text-xs text-gray-500">{getPhone()}</p>
              <p className="text-xs text-gray-400">ID: {dbUser?.memberId || '—'}</p>
            </div>
            <button onClick={() => navigate('/profile')} className="px-3 py-2 bg-gray-100 rounded-lg text-sm">
              প্রোফাইল
            </button>
          </div>
        </div>
      </div>

       <div className="px-4 space-y-4 mt-4">
        {/* Payment Button */}
        <BigButton label="জমা করুন" onClick={() => setShowDepositModal(true)} color="green" />

        {/* Monthly Status Section */}
        {monthlyData && (
          <Section title="মাসিক পেমেন্ট স্ট্যাটাস" defaultOpen={true}>
            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">অগ্রগতি</span>
                <span className="font-bold text-green-600">{paidCount}/১২ মাস</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div className="bg-green-500 h-3 rounded-full" style={{ width: `${(paidCount / 12) * 100}%` }} />
              </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <StatBox label="পরিশোধিত" value={paidCount} color="green" />
              <StatBox label="অপেক্ষমাণ" value={pendingCount} color="orange" />
              <StatBox label="বকেয়া" value={dueCount} color="red" />
            </div>

            {/* Due Alert */}
            {unpaidMonths.length > 0 && (
              <div className="bg-red-50 rounded-xl p-3 border border-red-200">
                <p className="text-sm font-bold text-red-700 mb-1">⚠️ বকেয়া মাসসমূহ</p>
                <p className="text-sm text-red-600">{unpaidMonths.join(', ')}</p>
              </div>
            )}
          </Section>
        )}

        {/* Recent Transactions */}
        <Section title="সাম্প্রতিক লেনদেন" defaultOpen={false}>
          {txLoading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400">কোনো লেনদেন নেই</p>
            </div>
          ) : (
            transactions.slice(0, 5).map(tx => (
              <TransactionItem key={tx._id} transaction={tx} />
            ))
          )}
        </Section>

        {/* Targets Section */}
        {targets.length > 0 && (
          <Section title="লক্ষ্যমাত্রা" defaultOpen={false}>
            {targets.slice(0, 3).map(t => (
              <TargetItem key={t._id} target={t} />
            ))}
          </Section>
        )}

        {/* Gallery Section */}
        <Section title="গ্যালারি" defaultOpen={true}>
          {/* Upload Button */}
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full py-3 mb-4 bg-blue-600 text-white rounded-xl text-base font-bold flex items-center justify-center gap-2"
          >
            <Plus size={20} /> নতুন ছবি শেয়ার করুন
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => {
            const f = e.target.files[0];
            if (f) {
              setSelectedFile(f);
              setPreview(URL.createObjectURL(f));
            }
          }} />

          {/* Photos Feed */}
          {photosLoading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : photos.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-xl">
              <Camera size={40} className="text-gray-300 mx-auto mb-2" />
              <p className="text-gray-400">কোনো ছবি নেই</p>
            </div>
          ) : (
            photos.map((photo, idx) => (
              <PhotoPost
                key={photo._id}
                photo={photo}
                onLike={toggleLike}
                onDelete={deletePhoto}
                onImageClick={() => openLightbox(photo, idx)}
                isLiked={likedPhotos[photo._id] || false}
                likesCount={photoLikes[photo._id]?.length || 0}
                currentUserId={dbUser?._id}
                isAdmin={dbUser?.role === 'admin'}
              />
            ))
          )}
        </Section>
      </div>

      {/* Upload Modal */}
      {preview && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-gray-800">
            <button onClick={() => { setSelectedFile(null); setPreview(null); }} className="text-white">
              <X size={24} />
            </button>
            <span className="text-white font-semibold">নতুন পোস্ট</span>
            <button onClick={handleUpload} disabled={uploading} className="text-blue-500 font-semibold">
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
              className="w-full px-4 py-3 rounded-xl bg-gray-800 text-white placeholder-gray-400 outline-none resize-none"
              rows={3}
            />
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
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
          <div className="p-4 bg-black/50">
            <button onClick={() => toggleLike(selectedPhoto._id, selectedPhoto.uploadedBy?._id)} className="mb-2">
              <Heart size={28} className={likedPhotos[selectedPhoto._id] ? 'text-red-500 fill-red-500' : 'text-white'} />
            </button>
            {photoLikes[selectedPhoto._id]?.length > 0 && (
              <p className="text-white text-sm font-semibold">{photoLikes[selectedPhoto._id].length} জন পছন্দ করেছেন</p>
            )}
            {selectedPhoto.caption && (
              <p className="text-white text-sm mt-2">
                <span className="font-semibold">{selectedPhoto.uploadedBy?.name}</span> {selectedPhoto.caption}
              </p>
            )}
          </div>
          {/* Navigation Arrows */}
          <button
            className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"
            onClick={() => {
              const newIdx = (lightboxIdx - 1 + photos.length) % photos.length;
              setLightboxIdx(newIdx);
              setSelectedPhoto(photos[newIdx]);
            }}
          >
            <ChevronLeft size={24} className="text-white" />
          </button>
          <button
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"
            onClick={() => {
              const newIdx = (lightboxIdx + 1) % photos.length;
              setLightboxIdx(newIdx);
              setSelectedPhoto(photos[newIdx]);
            }}
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