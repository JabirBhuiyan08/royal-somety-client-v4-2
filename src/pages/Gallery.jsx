// client/src/pages/Gallery.jsx
import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import useAxios from '../hooks/useAxios';
import { useAuth } from '../providers/AuthProvider';
import { db } from '../utils/firebase';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, onSnapshot, orderBy, serverTimestamp } from 'firebase/firestore';
import { Images, X, ChevronLeft, ChevronRight, Plus, Upload, Trash2, Camera, Heart } from 'lucide-react';
import toast from 'react-hot-toast';

const Gallery = () => {
  const axios = useAxios();
  const qc = useQueryClient();
  const { dbUser } = useAuth();
  const [selected, setSelected] = useState(null);
  const [lightboxIdx, setLightboxIdx] = useState(0);
  const [caption, setCaption] = useState('');
  const [preview, setPreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [photoLikes, setPhotoLikes] = useState({});
  const fileRef = useRef(null);

  const { data: photos = [], isLoading } = useQuery({
    queryKey: ['gallery'],
    queryFn: () => axios.get('/member/gallery').then(r => r.data.photos),
  });

  useEffect(() => {
    if (!selected?._id) return;
    
    const likesQuery = query(collection(db, 'likes'), where('photoId', '==', selected._id));
    
    const unsubLikes = onSnapshot(likesQuery, (snap) => {
      const likes = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setPhotoLikes(prev => ({ ...prev, [selected._id]: likes }));
    });
    
    return () => {
      unsubLikes();
    };
  }, [selected?._id]);

  const openLightbox = (idx) => { 
    setLightboxIdx(idx); 
    setSelected(photos[idx]); 
  };
  
  const navLight = (dir) => { 
    const i = (lightboxIdx + dir + photos.length) % photos.length; 
    setLightboxIdx(i); 
    setSelected(photos[i]); 
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
      toast.success('ছবি আপলোড হয়েছে 📸');
      qc.invalidateQueries(['gallery']);
      setSelectedFile(null); 
      setPreview(null); 
      setCaption('');
    } catch { 
      toast.error('আপলোড ব্যর্থ'); 
    } finally { 
      setUploading(false); 
      if (fileRef.current) fileRef.current.value = ''; 
    }
  };

  const deleteMutation = useMutation({
    mutationFn: (id) => axios.delete(`/member/gallery/${id}`),
    onSuccess: () => { 
      toast.success('মুছে ফেলা হয়েছে'); 
      qc.invalidateQueries(['gallery']); 
      setSelected(null); 
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
      } else {
        await addDoc(collection(db, 'likes'), {
          photoId,
          userId: dbUser._id,
          userName: dbUser.name,
          userAvatar: dbUser.avatar,
          createdAt: serverTimestamp(),
        });
        
        if (photoOwnerId && photoOwnerId !== dbUser._id) {
          try {
            const token = localStorage.getItem('token');
            await axios.post('/member/notifications', {
              type: 'gallery_like',
              title: 'কেউ আপনার ছবি পছন্দ করেছে',
              message: `${dbUser.name} আপনার ছবি পছন্দ করেছে ❤️`,
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
  const isLiked = (photoId) => {
    const likes = getLikes(photoId);
    return likes.some(l => l.userId === dbUser?._id);
  };

  const formatLikes = (photoId) => {
    const likes = getLikes(photoId);
    if (likes.length === 0) return '';
    const userIds = likes.map(l => l.userId);
    if (userIds.includes(dbUser?._id)) {
      if (likes.length === 1) return 'আপনি পছন্দ করেছেন';
      if (likes.length === 2) return `আপনি এবং আর ১ জন`;
      return `আপনি এবং আর ${likes.length - 1} জন`;
    }
    if (likes.length === 1) return likes[0].userName;
    if (likes.length === 2) return `${likes[0].userName} এবং ${likes[1].userName}`;
    return `${likes[0].userName} এবং আর ${likes.length - 1} জন`;
  };

  return (
    <div className="px-4 py-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
            <Images size={20} className="text-blue-600" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-800">আমাদের গ্যালারি</h2>
            <p className="text-xs text-gray-400">{photos.length}টি ছবি</p>
          </div>
        </div>
        <button 
          onClick={() => fileRef.current?.click()}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 active:scale-95 transition-all"
        >
          <Camera size={14} />
          <span>ছবি যোগ করুন</span>
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      </div>

      {/* Upload Preview Panel */}
      {preview && (
        <div className="bg-white rounded-2xl p-4 mb-5 shadow-sm border border-gray-100">
          <div className="relative rounded-xl overflow-hidden mb-3 aspect-video bg-gray-50">
            <img src={preview} alt="preview" className="w-full h-full object-cover" />
            <button 
              onClick={() => { setSelectedFile(null); setPreview(null); }}
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-sm active:scale-95 transition-all"
            >
              <X size={14} className="text-gray-600" />
            </button>
          </div>
          <input 
            value={caption} 
            onChange={e => setCaption(e.target.value)}
            placeholder="ক্যাপশন লিখুন (ঐচ্ছিক)" 
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none mb-3"
          />
          <button 
            onClick={handleUpload} 
            disabled={uploading} 
            className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
          >
            <span className="flex items-center justify-center gap-2">
              <Upload size={15} />
              {uploading ? 'আপলোড হচ্ছে...' : 'গ্যালারিতে যোগ করুন'}
            </span>
          </button>
        </div>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="grid grid-cols-3 gap-2">
          {[...Array(9)].map((_, i) => (
            <div key={i} className="aspect-square rounded-xl bg-gray-200 animate-pulse" />
          ))}
        </div>
      ) : photos.length === 0 && !preview ? (
        <button 
          onClick={() => fileRef.current?.click()}
          className="w-full h-48 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-3 hover:bg-gray-100 active:scale-95 transition-all"
        >
          <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center">
            <Camera size={24} className="text-gray-300" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-500">প্রথম ছবিটি যোগ করুন</p>
            <p className="text-xs text-gray-300 mt-0.5">ট্যাপ করুন</p>
          </div>
        </button>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {photos.map((photo, idx) => {
            const likes = getLikes(photo._id);
            return (
              <button 
                key={photo._id} 
                onClick={() => openLightbox(idx)}
                className="relative aspect-square rounded-xl overflow-hidden shadow-sm hover:shadow-md active:scale-95 transition-all"
              >
                <img 
                  src={photo.url} 
                  alt={photo.caption || ''} 
                  className="w-full h-full object-cover" 
                />
                {(likes.length > 0 || photo.uploadedBy?.avatar) && (
                  <div className="absolute bottom-1 left-1 right-1 flex items-center justify-between">
                    {likes.length > 0 && (
                      <div className="flex items-center gap-0.5 bg-black/50 px-1.5 py-0.5 rounded-full">
                        <Heart size={10} className="text-red-500 fill-red-500" />
                        <span className="text-[10px] text-white font-medium">{likes.length}</span>
                      </div>
                    )}
                    {photo.uploadedBy?.avatar && (
                      <img 
                        src={photo.uploadedBy.avatar} 
                        alt=""
                        className="w-5 h-5 rounded-full border-2 border-white shadow-sm ml-auto" 
                      />
                    )}
                  </div>
                )}
              </button>
            );
          })}
          <button 
            onClick={() => fileRef.current?.click()}
            className="aspect-square rounded-xl bg-gray-50 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-1 hover:bg-gray-100 active:scale-95 transition-all"
          >
            <Plus size={20} className="text-gray-300" />
            <span className="text-xs text-gray-300">যোগ করুন</span>
          </button>
        </div>
      )}

      {/* Lightbox Modal */}
      {selected && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={() => setSelected(null)}
        >
          <button 
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center active:scale-95 transition-all"
            onClick={() => setSelected(null)}
          >
            <X size={20} className="text-white" />
          </button>
          
          <button 
            className="absolute left-3 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center active:scale-95 transition-all"
            onClick={e => { e.stopPropagation(); navLight(-1); }}
          >
            <ChevronLeft size={20} className="text-white" />
          </button>
          
          <div className="px-12 max-w-full flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <img 
              src={selected.url} 
              alt="" 
              className="max-h-[60vh] max-w-full rounded-xl object-contain" 
            />
            
            {/* Actions Bar */}
            <div className="flex items-center justify-center gap-4 mt-3">
              <button 
                onClick={() => toggleLike(selected._id, selected.uploadedBy?._id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-full active:scale-95 transition-all ${isLiked(selected._id) ? 'bg-red-500/80' : 'bg-white/10 hover:bg-white/20'}`}
              >
                <Heart size={18} className={isLiked(selected._id) ? 'text-white fill-white' : 'text-white'} />
                <span className="text-sm text-white font-medium">{getLikes(selected._id).length || ''}</span>
              </button>
            </div>
            
            {/* Likes Info */}
            {formatLikes(selected._id) && (
              <p className="text-center text-xs text-white/60 mt-2">{formatLikes(selected._id)} পছন্দ করেছেন</p>
            )}
            
            {/* Uploader Info */}
            {selected.uploadedBy && (
              <div className="flex items-center justify-center gap-2 mt-2">
                {selected.uploadedBy.avatar && (
                  <img src={selected.uploadedBy.avatar} className="w-6 h-6 rounded-full" alt="" />
                )}
                <span className="text-white/60 text-xs">{selected.uploadedBy.name}</span>
              </div>
            )}
            
            {/* Caption */}
            {selected.caption && (
              <p className="text-center text-sm text-white/70 mt-1">{selected.caption}</p>
            )}
            
            <p className="text-center text-xs text-white/30 mt-1">
              {lightboxIdx + 1} / {photos.length}
            </p>
            
            {/* Delete Button */}
            {(String(selected.uploadedBy?._id) === String(dbUser?._id) || dbUser?.role === 'admin') && (
              <div className="flex justify-center mt-4">
                <button 
                  onClick={() => deleteMutation.mutate(selected._id)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-500/80 hover:bg-red-600 text-white text-xs font-medium active:scale-95 transition-all"
                >
                  <Trash2 size={13} /> মুছুন
                </button>
              </div>
            )}
          </div>
          
          <button 
            className="absolute right-3 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center active:scale-95 transition-all"
            onClick={e => { e.stopPropagation(); navLight(1); }}
          >
            <ChevronRight size={20} className="text-white" />
          </button>
        </div>
      )}
    </div>
  );
};

export default Gallery;