// client/src/pages/AdminSettings.jsx
import { useState, useRef, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import useAxios from '../hooks/useAxios';
import { 
  Image, Target, Plus, Trash2, Upload, X, Edit2, 
  Calendar, DollarSign, AlertCircle, CheckCircle, 
  Loader2, RefreshCw, FolderOpen, Grid, List,
  TrendingUp, Award, Clock
} from 'lucide-react';
import toast from 'react-hot-toast';
import { TARGET_CATEGORIES } from '../utils/constants';

// ==================== CONSTANTS ====================

const CATEGORY_COLORS = {
  'আয়': { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  'ব্যয়': { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  'উন্নয়ন': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  'সামাজিক': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  'শিক্ষা': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  'স্বাস্থ্য': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
};

const DEFAULT_CATEGORY_COLOR = { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' };

// ==================== COMPONENTS ====================

const LoadingSpinner = () => (
  <div className="flex justify-center py-16">
    <Loader2 size={32} className="animate-spin text-blue-500" />
  </div>
);

const EmptyState = ({ icon: Icon, title, message, action }) => (
  <div className="text-center py-12 bg-white rounded-xl border border-slate-100">
    <Icon size={48} className="mx-auto text-slate-300 mb-3" />
    <p className="text-slate-600 font-medium mb-1">{title}</p>
    <p className="text-sm text-slate-400 mb-4">{message}</p>
    {action && action}
  </div>
);

const ImageUploader = ({ onUpload, isUploading }) => {
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const [caption, setCaption] = useState('');
  const fileRef = useRef(null);

  const handleFileSelect = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (!f.type.startsWith('image/')) {
      toast.error('শুধুমাত্র ছবি ফাইল আপলোড করুন');
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      toast.error('ছবির সাইজ 5MB এর কম হতে হবে');
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleUpload = async () => {
    if (!file) return;
    await onUpload(file, caption);
    setFile(null);
    setPreview(null);
    setCaption('');
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleCancel = () => {
    setFile(null);
    setPreview(null);
    setCaption('');
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="p-4 border-b border-slate-100">
        <h3 className="font-semibold text-slate-800">নতুন ছবি আপলোড</h3>
        <p className="text-xs text-slate-500 mt-1">JPG, PNG, GIF (সর্বোচ্চ 5MB)</p>
      </div>
      
      <div className="p-4 space-y-4">
        <label 
          className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all cursor-pointer ${
            preview ? 'h-48' : 'h-32'
          } ${file ? 'border-blue-400 bg-blue-50' : 'border-slate-200 bg-slate-50 hover:border-blue-300 hover:bg-blue-50/50'}`}
        >
          {preview ? (
            <img src={preview} className="w-full h-full object-cover rounded-lg" alt="Preview" />
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload size={28} className="text-slate-400" />
              <p className="text-sm text-slate-500">ছবি নির্বাচন করুন অথবা টেনে আনুন</p>
              <p className="text-xs text-slate-400">ক্লিক করুন অথবা Drag & Drop</p>
            </div>
          )}
          <input 
            ref={fileRef}
            type="file" 
            accept="image/*" 
            className="hidden" 
            onChange={handleFileSelect}
          />
        </label>
        
        {file && (
          <>
            <input
              value={caption}
              onChange={e => setCaption(e.target.value)}
              placeholder="ছবির ক্যাপশন (ঐচ্ছিক)"
              className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition"
              maxLength="100"
            />
            <div className="flex gap-3">
              <button 
                onClick={handleUpload} 
                disabled={isUploading} 
                className="flex-1 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 transition-all"
              >
                <span className="flex items-center justify-center gap-2">
                  {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                  {isUploading ? 'আপলোড হচ্ছে...' : 'আপলোড করুন'}
                </span>
              </button>
              <button 
                onClick={handleCancel} 
                className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
              >
                বাতিল
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const GalleryGrid = ({ photos, onDelete, isDeleting }) => {
  const [viewMode, setViewMode] = useState('grid');

  if (photos.length === 0) {
    return (
      <EmptyState
        icon={FolderOpen}
        title="কোনো ছবি নেই"
        message="এখনও কোনো ছবি আপলোড করা হয়নি"
      />
    );
  }

  if (viewMode === 'grid') {
    return (
      <div>
        <div className="flex justify-end mb-3">
          <button
            onClick={() => setViewMode('list')}
            className="p-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition"
          >
            <List size={16} />
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {photos.map(photo => (
            <div key={photo._id} className="group relative aspect-square rounded-xl overflow-hidden bg-slate-100">
              <img 
                src={photo.url} 
                alt={photo.caption || 'Gallery image'} 
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="absolute bottom-0 left-0 right-0 p-2">
                  {photo.caption && (
                    <p className="text-xs text-white truncate">{photo.caption}</p>
                  )}
                  <p className="text-xs text-white/70">{new Date(photo.createdAt).toLocaleDateString('bn-BD')}</p>
                </div>
                <button
                  onClick={() => onDelete(photo._id)}
                  disabled={isDeleting === photo._id}
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-500 text-white hover:bg-red-600 transition"
                >
                  {isDeleting === photo._id ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Trash2 size={12} />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-end mb-3">
        <button
          onClick={() => setViewMode('grid')}
          className="p-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition"
        >
          <Grid size={16} />
        </button>
      </div>
      <div className="space-y-3">
        {photos.map(photo => (
          <div key={photo._id} className="flex gap-3 p-3 bg-white rounded-xl border border-slate-200">
            <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-slate-100">
              <img src={photo.url} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-800 line-clamp-2">{photo.caption || 'ক্যাপশন নেই'}</p>
              <p className="text-xs text-slate-400 mt-1">{new Date(photo.createdAt).toLocaleDateString('bn-BD')}</p>
            </div>
            <button
              onClick={() => onDelete(photo._id)}
              disabled={isDeleting === photo._id}
              className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition"
            >
              {isDeleting === photo._id ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Trash2 size={14} />
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

const TargetForm = ({ onSubmit, isSubmitting }) => {
  const [form, setForm] = useState({
    title: '',
    category: TARGET_CATEGORIES[0],
    goal: '',
    description: '',
    deadline: '',
  });

  const handleSubmit = () => {
    if (!form.title.trim()) {
      toast.error('লক্ষ্যের শিরোনাম লিখুন');
      return;
    }
    if (!form.goal || Number(form.goal) <= 0) {
      toast.error('বৈধ লক্ষ্যমাত্রা লিখুন');
      return;
    }
    onSubmit(form);
    setForm({
      title: '',
      category: TARGET_CATEGORIES[0],
      goal: '',
      description: '',
      deadline: '',
    });
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="p-4 border-b border-slate-100">
        <h3 className="font-semibold text-slate-800">নতুন লক্ষ্য তৈরি করুন</h3>
        <p className="text-xs text-slate-500 mt-1">সদস্যদের জন্য লক্ষ্যমাত্রা নির্ধারণ করুন</p>
      </div>
      
      <div className="p-4 space-y-4">
        <input
          value={form.title}
          onChange={e => setForm({...form, title: e.target.value})}
          placeholder="লক্ষ্যের শিরোনাম *"
          className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition"
        />
        
        <select
          value={form.category}
          onChange={e => setForm({...form, category: e.target.value})}
          className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition bg-white"
        >
          {TARGET_CATEGORIES.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        
        <div className="relative">
          <DollarSign size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="number"
            value={form.goal}
            onChange={e => setForm({...form, goal: e.target.value})}
            placeholder="লক্ষ্যমাত্রা (৳) *"
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition"
          />
        </div>
        
        <div className="relative">
          <Calendar size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="date"
            value={form.deadline}
            onChange={e => setForm({...form, deadline: e.target.value})}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition"
          />
        </div>
        
        <textarea
          value={form.description}
          onChange={e => setForm({...form, description: e.target.value})}
          placeholder="বিবরণ (ঐচ্ছিক)"
          rows={3}
          className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition resize-none"
        />
        
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 transition-all"
        >
          <span className="flex items-center justify-center gap-2">
            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
            {isSubmitting ? 'তৈরি হচ্ছে...' : 'লক্ষ্য তৈরি করুন'}
          </span>
        </button>
      </div>
    </div>
  );
};

const TargetCard = ({ target, onDelete, isDeleting }) => {
  const percentage = Math.min(Math.round((target.collected / target.goal) * 100), 100);
  const colors = CATEGORY_COLORS[target.category] || DEFAULT_CATEGORY_COLOR;
  const isCompleted = percentage >= 100;
  const isNearComplete = percentage >= 70 && percentage < 100;
  
  const formattedDeadline = target.deadline 
    ? new Date(target.deadline).toLocaleDateString('bn-BD')
    : null;
  const isExpired = target.deadline && new Date(target.deadline) < new Date();

  return (
    <div className="bg-white rounded-xl border border-slate-200 hover:shadow-md transition-all duration-200 overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-slate-800">{target.title}</h3>
              {isCompleted && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs">
                  <CheckCircle size={10} /> সম্পন্ন
                </span>
              )}
              {isExpired && !isCompleted && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs">
                  <AlertCircle size={10} /> মেয়াদ উত্তীর্ণ
                </span>
              )}
            </div>
            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}>
              {target.category}
            </span>
          </div>
          <button
            onClick={() => onDelete(target._id)}
            disabled={isDeleting}
            className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition disabled:opacity-50"
          >
            {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
          </button>
        </div>
        
        {target.description && (
          <p className="text-sm text-slate-600 mb-3 line-clamp-2">{target.description}</p>
        )}
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-green-600 font-semibold">৳{target.collected?.toLocaleString()}</span>
            <span className="text-slate-400">লক্ষ্য: ৳{target.goal?.toLocaleString()}</span>
          </div>
          
          <div className="relative">
            <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  isCompleted ? 'bg-green-500' : isNearComplete ? 'bg-amber-500' : 'bg-blue-500'
                }`}
                style={{ width: `${Math.min(percentage, 100)}%` }}
              />
            </div>
            <div className="absolute right-0 -top-5">
              <span className={`text-xs font-bold ${percentage >= 60 ? 'text-green-600' : 'text-amber-600'}`}>
                {percentage}%
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3 mt-3 pt-2 border-t border-slate-100">
          {formattedDeadline && (
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <Calendar size={12} />
              <span>শেষ তারিখ: {formattedDeadline}</span>
            </div>
          )}
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <TrendingUp size={12} />
            <span>{target.collected?.toLocaleString()} / {target.goal?.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== MAIN COMPONENT ====================

const AdminSettings = ({ initialTab = 'gallery' }) => {
  const axios = useAxios();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [deletingPhotoId, setDeletingPhotoId] = useState(null);
  const [deletingTargetId, setDeletingTargetId] = useState(null);

  // Keep activeTab in sync if the route prop changes
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // Queries
  const { 
    data: photos = [], 
    isLoading: isLoadingPhotos,
    refetch: refetchPhotos 
  } = useQuery({
    queryKey: ['admin-gallery'],
    enabled: activeTab === 'gallery',
    queryFn: () => axios.get('/member/gallery').then(r => r.data.photos),
  });
  
  const { 
    data: targets = [], 
    isLoading: isLoadingTargets,
    refetch: refetchTargets
  } = useQuery({
    queryKey: ['admin-targets'],
    enabled: activeTab === 'targets',
    queryFn: () => axios.get('/member/targets').then(r => r.data.targets),
  });

  // Mutations
  const uploadMutation = useMutation({
    mutationFn: ({ file, caption }) => {
      const fd = new FormData();
      fd.append('photo', file);
      fd.append('caption', caption);
      return axios.post('/admin/gallery', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    },
    onSuccess: () => {
      toast.success('ছবি আপলোড হয়েছে');
      queryClient.invalidateQueries(['admin-gallery']);
    },
    onError: () => toast.error('আপলোড ব্যর্থ হয়েছে'),
  });

  const deletePhotoMutation = useMutation({
    mutationFn: (id) => axios.delete(`/admin/gallery/${id}`),
    onSuccess: () => {
      toast.success('ছবি মুছে ফেলা হয়েছে');
      queryClient.invalidateQueries(['admin-gallery']);
      setDeletingPhotoId(null);
    },
    onError: () => {
      toast.error('মুছতে ব্যর্থ হয়েছে');
      setDeletingPhotoId(null);
    },
  });

  const createTargetMutation = useMutation({
    mutationFn: (data) => axios.post('/admin/targets', data),
    onSuccess: () => {
      toast.success('লক্ষ্য তৈরি হয়েছে');
      queryClient.invalidateQueries(['admin-targets']);
    },
    onError: () => toast.error('লক্ষ্য তৈরি ব্যর্থ হয়েছে'),
  });

  const deleteTargetMutation = useMutation({
    mutationFn: (id) => axios.delete(`/admin/targets/${id}`),
    onSuccess: () => {
      toast.success('লক্ষ্য মুছে ফেলা হয়েছে');
      queryClient.invalidateQueries(['admin-targets']);
      setDeletingTargetId(null);
    },
    onError: () => {
      toast.error('মুছতে ব্যর্থ হয়েছে');
      setDeletingTargetId(null);
    },
  });

  // Handlers
  const handleUploadPhoto = async (file, caption) => {
    await uploadMutation.mutateAsync({ file, caption });
  };

  const handleDeletePhoto = (id) => {
    if (window.confirm('এই ছবিটি মুছে ফেলতে চান?')) {
      setDeletingPhotoId(id);
      deletePhotoMutation.mutate(id);
    }
  };

  const handleCreateTarget = async (data) => {
    await createTargetMutation.mutateAsync(data);
  };

  const handleDeleteTarget = (id) => {
    if (window.confirm('এই লক্ষ্যটি মুছে ফেলতে চান?')) {
      setDeletingTargetId(id);
      deleteTargetMutation.mutate(id);
    }
  };

  const tabs = [
    { key: 'gallery', icon: Image, label: 'গ্যালারি' },
    { key: 'targets', icon: Target, label: 'লক্ষ্যমাত্রা' },
  ];

  const isLoading = activeTab === 'gallery' ? isLoadingPhotos : isLoadingTargets;

  return (
    <div className="min-h-screen bg-slate-50 pb-8">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800">সেটিংস ও ব্যবস্থাপনা</h1>
          <p className="text-slate-500 mt-1">গ্যালারি পরিচালনা ও লক্ষ্যমাত্রা নির্ধারণ করুন</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 mb-6 rounded-xl bg-slate-100">
          {tabs.map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === key
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Icon size={16} />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Gallery Tab */}
        {activeTab === 'gallery' && (
          <div className="space-y-6">
            <ImageUploader 
              onUpload={handleUploadPhoto} 
              isUploading={uploadMutation.isPending} 
            />
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-slate-800">গ্যালারি</h2>
                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs">
                  {photos.length} টি ছবি
                </span>
              </div>
              <button
                onClick={() => refetchPhotos()}
                className="p-2 rounded-lg hover:bg-slate-100 transition"
              >
                <RefreshCw size={16} className="text-slate-500" />
              </button>
            </div>
            
            {isLoading ? (
              <LoadingSpinner />
            ) : (
              <GalleryGrid 
                photos={photos} 
                onDelete={handleDeletePhoto}
                isDeleting={deletingPhotoId}
              />
            )}
          </div>
        )}

        {/* Targets Tab */}
        {activeTab === 'targets' && (
          <div className="space-y-6">
            <TargetForm 
              onSubmit={handleCreateTarget}
              isSubmitting={createTargetMutation.isPending}
            />
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-slate-800">সকল লক্ষ্যমাত্রা</h2>
                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs">
                  {targets.length} টি লক্ষ্য
                </span>
              </div>
              <button
                onClick={() => refetchTargets()}
                className="p-2 rounded-lg hover:bg-slate-100 transition"
              >
                <RefreshCw size={16} className="text-slate-500" />
              </button>
            </div>
            
            {isLoading ? (
              <LoadingSpinner />
            ) : targets.length === 0 ? (
              <EmptyState
                icon={Target}
                title="কোনো লক্ষ্য নেই"
                message="নতুন লক্ষ্য তৈরি করে শুরু করুন"
              />
            ) : (
              <div className="space-y-3">
                {targets.map(target => (
                  <TargetCard
                    key={target._id}
                    target={target}
                    onDelete={handleDeleteTarget}
                    isDeleting={deletingTargetId === target._id}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSettings;