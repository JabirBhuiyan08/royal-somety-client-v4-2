// client/src/pages/Gallery.jsx
import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import useAxios from '../hooks/useAxios';
import { useAuth } from '../providers/AuthProvider';
import { db } from '../utils/firebase';
import { collection, query, where, addDoc, deleteDoc, doc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { 
  Heart, 
  Trash2, 
  Camera, 
  X, 
  ChevronLeft, 
  ChevronRight,
  Plus
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { bn } from 'date-fns/locale';

const Gallery = () => {
  const axios = useAxios();
  const qc = useQueryClient();
  const { dbUser } = useAuth();
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

  const { data: photos = [], isLoading, refetch } = useQuery({
    queryKey: ['gallery'],
    queryFn: () => axios.get('/member/gallery').then(r => r.data.photos),
  });

  // Listen to likes for all photos
  useEffect(() => {
    if (!photos.length) return;
    
    const unsubscribes = [];
    
    photos.forEach(photo => {
      const likesQuery = query(collection(db, 'likes'), where('photoId', '==', photo._id));
      const unsubscribe = onSnapshot(likesQuery, (snap) => {
        const likes = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setPhotoLikes(prev => ({ ...prev, [photo._id]: likes }));
        
        // Check if current user liked this photo
        if (dbUser) {
          const userLiked = likes.some(l => l.userId === dbUser._id);
          setLikedPhotos(prev => ({ ...prev, [photo._id]: userLiked }));
        }
      });
      unsubscribes.push(unsubscribe);
    });
    
    return () => unsubscribes.forEach(unsub => unsub());
  }, [photos, dbUser]);

  const openLightbox = (photo, idx) => { 
    setLightboxIdx(idx); 
    setSelectedPhoto(photo); 
  };

  const closeLightbox = () => {
    setSelectedPhoto(null);
  };

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
      refetch();
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
      refetch(); 
      setSelectedPhoto(null); 
    },
    onError: () => toast.error('মুছতে ব্যর্থ'),
  });

  const toggleLike = async (photoId, photoOwnerId) => {
    if (!dbUser) return;
    const likes = photoLikes[photoId] || [];
    const existingLike = likes.find(l => l.userId === dbUser._id);
    
    try {
      if (existingLike) {
        await deleteDoc(doc(db, 'likes', existingLike.id));
        // Optimistic update
        setLikedPhotos(prev => ({ ...prev, [photoId]: false }));
      } else {
        await addDoc(collection(db, 'likes'), {
          photoId,
          userId: dbUser._id,
          userName: dbUser.name,
          userAvatar: dbUser.avatar,
          createdAt: serverTimestamp(),
        });
        // Optimistic update
        setLikedPhotos(prev => ({ ...prev, [photoId]: true }));
        
        // Send notification
        if (photoOwnerId && photoOwnerId !== dbUser._id) {
          try {
            const token = localStorage.getItem('token');
            await axios.post('/member/notifications', {
              type: 'gallery_like',
              title: 'কেউ আপনার ছবি পছন্দ করেছে',
              message: `${dbUser.name} আপনার ছবি পছন্দ করেছেন ❤️`,
              photoId,
              targetUserId: photoOwnerId,
            }, { headers: { Authorization: `Bearer ${token}` } });
          } catch (e) {
            console.error('Notification error:', e);
          }
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
        const other = likes.find(l => l.userId !== dbUser?._id);
        return `আপনি এবং ${other?.userName}`;
      }
      return `${likes[0].userName} এবং ${likes[1].userName}`;
    }
    if (isLiked(photoId)) {
      const othersCount = count - 1;
      return `আপনি এবং আর ${othersCount} জন`;
    }
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

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      {/* Instagram-style Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Camera size={24} className="text-blue-600" />
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            গ্যালারি
          </h1>
        </div>
        <button 
          onClick={() => fileRef.current?.click()}
          className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center active:scale-95 transition-all"
        >
          <Plus size={18} className="text-blue-600" />
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      </div>

      {/* Upload Preview */}
      {preview && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col animate-slideUp">
          <div className="flex items-center justify-between p-4 border-b border-gray-800">
            <button onClick={() => { setSelectedFile(null); setPreview(null); }} className="text-white">
              <X size={24} />
            </button>
            <span className="text-white font-semibold">নতুন পোস্ট</span>
            <button 
              onClick={handleUpload} 
              disabled={uploading}
              className="text-blue-500 font-semibold disabled:opacity-50"
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
              className="w-full px-4 py-3 rounded-xl bg-gray-800 text-white placeholder-gray-400 border-0 outline-none resize-none"
              rows="3"
            />
          </div>
        </div>
      )}

      {/* Instagram Feed */}
      {isLoading ? (
        <div className="space-y-4 p-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl overflow-hidden animate-pulse">
              <div className="flex items-center gap-3 p-3">
                <div className="w-10 h-10 rounded-full bg-gray-200" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-32 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-24" />
                </div>
              </div>
              <div className="aspect-square bg-gray-200" />
              <div className="p-3 space-y-2">
                <div className="h-8 bg-gray-200 rounded w-32" />
                <div className="h-3 bg-gray-200 rounded w-full" />
                <div className="h-3 bg-gray-200 rounded w-3/4" />
              </div>
            </div>
          ))}
        </div>
      ) : photos.length === 0 ? (
        <div 
        onClick={() => fileRef.current?.click()}
        className="flex flex-col items-center justify-center h-[70vh] px-4">
          <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <Camera size={40} className="text-gray-300" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">কোনো ছবি নেই</h3>
          <p className="text-sm text-gray-400 text-center mb-6">
            প্রথম ছবিটি শেয়ার করুন এবং গ্যালারি শুরু করুন
          </p>
          <button 
            className="px-6 py-3 bg-blue-600 text-white rounded-full font-semibold shadow-lg active:scale-95 transition-all"
          >
            প্রথম ছবি শেয়ার করুন
          </button>
        </div>
      ) : (
        <div className="space-y-4 pb-4">
          {photos.map((photo, idx) => {
            const likesCount = getLikes(photo._id).length;
            const likesText = formatLikesText(photo._id);
            
            return (
              <div key={photo._id} className="bg-white rounded-xl overflow-hidden shadow-sm">
                {/* Header - User Info */}
                <div className="flex items-center justify-between px-3 py-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-tr from-purple-500 to-pink-500 p-[2px]">
                      <div className="w-full h-full rounded-full overflow-hidden bg-white">
                        {photo.uploadedBy?.avatar ? (
                          <img 
                            src={photo.uploadedBy.avatar} 
                            alt="" 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                            <Camera size={14} className="text-gray-400" />
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-gray-900">
                        {photo.uploadedBy?.name || 'সদস্য'}
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatTime(photo.createdAt)}
                      </p>
                    </div>
                  </div>
                  
                  {(String(photo.uploadedBy?._id) === String(dbUser?._id) || dbUser?.role === 'admin') && (
                    <button 
                      onClick={() => setDeleteConfirm(photo)}
                      className="p-2 active:scale-95 transition-all"
                    >
                      <Trash2 size={18} className="text-gray-500" />
                    </button>
                  )}
                </div>

                {/* Photo */}
                <div 
                  className="relative cursor-pointer flex items-center justify-center bg-gray-100"
                  onClick={() => openLightbox(photo, idx)}
                >
                  <img 
                    src={photo.url} 
                    alt={photo.caption || ''} 
                    className="w-92 rounded-xl object-cover"
                  />
                </div>

                {/* Action Buttons - Only Like button */}
                <div className="px-3 pt-2 pb-1">
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => toggleLike(photo._id, photo.uploadedBy?._id)}
                      className="p-1 -ml-1 active:scale-95 transition-all"
                    >
                      <Heart 
                        size={24} 
                        className={`transition-all ${isLiked(photo._id) ? 'text-red-500 fill-red-500' : 'text-gray-700'}`}
                      />
                    </button>
                  </div>
                </div>

                {/* Likes */}
                {likesCount > 0 && (
                  <div className="px-3 pb-1">
                    <div className="flex items-center gap-1">
                      <Heart size={14} className="text-red-500 fill-red-500" />
                      <span className="text-sm font-semibold text-gray-900">
                        {getLikeCountText(photo._id)}
                      </span>
                    </div>
                    {likesText && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        {likesText} পছন্দ করেছেন
                      </p>
                    )}
                  </div>
                )}

                {/* Caption */}
                {photo.caption && (
                  <div className="px-3 pb-3">
                    <p className="text-sm text-gray-800">
                      <span className="font-semibold mr-2">
                        {photo.uploadedBy?.name || 'সদস্য'}
                      </span>
                      {photo.caption}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox Modal for Photo View */}
      {selectedPhoto && (
        <div 
          className="fixed inset-0 z-50 bg-black flex flex-col"
          onClick={closeLightbox} // This closes the lightbox without deleting
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-black/50">
            <button onClick={closeLightbox} className="text-white">
              <X size={24} />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-tr from-purple-500 to-pink-500 p-[2px]">
                <div className="w-full h-full rounded-full overflow-hidden bg-black">
                  {selectedPhoto.uploadedBy?.avatar ? (
                    <img src={selectedPhoto.uploadedBy.avatar} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                      <Camera size={14} className="text-gray-500" />
                    </div>
                  )}
                </div>
              </div>
              <span className="text-white font-semibold text-sm">
                {selectedPhoto.uploadedBy?.name || 'সদস্য'}
              </span>
            </div>
            {(String(selectedPhoto.uploadedBy?._id) === String(dbUser?._id) || dbUser?.role === 'admin') && (
              <button 
                onClick={(e) => {
                  e.stopPropagation(); // Prevent closing lightbox
                  setDeleteConfirm(selectedPhoto);
                }}
                className="text-white/70"
              >
                <Trash2 size={20} />
              </button>
            )}
          </div>

          {/* Photo */}
          <div className="flex-1 flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <img 
              src={selectedPhoto.url} 
              alt="" 
              className="max-w-full max-h-[70vh] object-contain"
            />
          </div>

          {/* Navigation */}
          <button 
            className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
            onClick={(e) => { 
              e.stopPropagation(); 
              const newIdx = (lightboxIdx - 1 + photos.length) % photos.length;
              setLightboxIdx(newIdx);
              setSelectedPhoto(photos[newIdx]);
            }}
          >
            <ChevronLeft size={24} className="text-white" />
          </button>
          
          <button 
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
            onClick={(e) => { 
              e.stopPropagation(); 
              const newIdx = (lightboxIdx + 1) % photos.length;
              setLightboxIdx(newIdx);
              setSelectedPhoto(photos[newIdx]);
            }}
          >
            <ChevronRight size={24} className="text-white" />
          </button>

          {/* Footer - Only like button */}
          <div className="bg-black/50 p-4 space-y-2">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => toggleLike(selectedPhoto._id, selectedPhoto.uploadedBy?._id)}
                className="flex items-center gap-1 active:scale-95 transition-all"
              >
                <Heart 
                  size={28} 
                  className={isLiked(selectedPhoto._id) ? 'text-red-500 fill-red-500' : 'text-white'}
                />
              </button>
            </div>
            
            {getLikes(selectedPhoto._id).length > 0 && (
              <div>
                <p className="text-white font-semibold text-sm">
                  {getLikeCountText(selectedPhoto._id)} পছন্দ
                </p>
                <p className="text-white/70 text-xs">
                  {formatLikesText(selectedPhoto._id)} পছন্দ করেছেন
                </p>
              </div>
            )}
            
            {selectedPhoto.caption && (
              <p className="text-white text-sm">
                <span className="font-semibold mr-2">
                  {selectedPhoto.uploadedBy?.name}
                </span>
                {selectedPhoto.caption}
              </p>
            )}
            
            <p className="text-white/50 text-xs">
              {formatTime(selectedPhoto.createdAt)}
            </p>
          </div>
</div>
        )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm animate-scaleUp">
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <Trash2 size={28} className="text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">মুছে ফেলবেন?</h3>
              <p className="text-sm text-gray-500">
                এই ছবি মুছে ফেললে পুনরায় ফিরে পাওয়া যাবে না।
              </p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-3 rounded-xl font-semibold bg-gray-100 text-gray-700 active:scale-95 transition-all"
              >
                বাতিল
              </button>
              <button 
                onClick={() => {
                  deleteMutation.mutate(deleteConfirm._id);
                  setDeleteConfirm(null);
                }}
                className="flex-1 py-3 rounded-xl font-semibold bg-red-600 text-white active:scale-95 transition-all"
              >
                মুছে ফেলুন
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        @keyframes scaleUp {
          from {
            transform: scale(0.9);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
        .animate-scaleUp {
          animation: scaleUp 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};

export default Gallery;