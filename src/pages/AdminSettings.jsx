// client/src/pages/AdminSettings.jsx
import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import useAxios from '../hooks/useAxios';
import { Image, Target, Plus, Trash2, Upload, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { TARGET_CATEGORIES } from '../utils/constants';

const AdminSettings = () => {
  const axios = useAxios();
  const qc = useQueryClient();
  const [tab, setTab] = useState('gallery');
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const [caption, setCaption] = useState('');
  const fileRef = useRef(null);
  const [tf, setTf] = useState({ title: '', category: TARGET_CATEGORIES[0], goal: '', description: '', deadline: '' });

  const { data: photos = [] } = useQuery({
    queryKey: ['admin-gallery'], enabled: tab === 'gallery',
    queryFn: () => axios.get('/member/gallery').then(r => r.data.photos),
  });
  const { data: targets = [] } = useQuery({
    queryKey: ['admin-targets'], enabled: tab === 'targets',
    queryFn: () => axios.get('/member/targets').then(r => r.data.targets),
  });

  const handleUpload = async () => {
    if (!file) return; setUploading(true);
    try {
      const fd = new FormData(); fd.append('photo', file); fd.append('caption', caption);
      await axios.post('/admin/gallery', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('ছবি আপলোড হয়েছে'); qc.invalidateQueries(['admin-gallery']);
      setFile(null); setPreview(null); setCaption('');
    } catch { toast.error('আপলোড ব্যর্থ'); } finally { setUploading(false); }
  };

  const delPhoto = useMutation({
    mutationFn: (id) => axios.delete(`/admin/gallery/${id}`),
    onSuccess: () => { toast.success('মুছে ফেলা হয়েছে'); qc.invalidateQueries(['admin-gallery']); },
  });

  const addTarget = useMutation({
    mutationFn: () => axios.post('/admin/targets', tf),
    onSuccess: () => { toast.success('লক্ষ্য তৈরি হয়েছে'); qc.invalidateQueries(['admin-targets']); setTf({ title: '', category: TARGET_CATEGORIES[0], goal: '', description: '', deadline: '' }); },
    onError: () => toast.error('লক্ষ্য তৈরি ব্যর্থ'),
  });

  const delTarget = useMutation({
    mutationFn: (id) => axios.delete(`/admin/targets/${id}`),
    onSuccess: () => { toast.success('মুছে ফেলা হয়েছে'); qc.invalidateQueries(['admin-targets']); },
  });

  return (
    <div className="px-4 py-4 page-enter pb-5">
      <h2 className="text-base font-bold text-slate-800 mb-4" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>সেটিংস ও ব্যবস্থাপনা</h2>

      <div className="flex gap-1 mb-5 p-1 rounded-xl bg-slate-100">
        {[{ key: 'gallery', icon: Image, label: 'গ্যালারি' }, { key: 'targets', icon: Target, label: 'লক্ষ্যমাত্রা' }].map(({ key, icon: Icon, label }) => (
          <button key={key} onClick={() => setTab(key)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-all"
            style={tab === key ? { background: '#fff', color: '#2563eb', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' } : { color: '#94a3b8' }}>
            <Icon size={14} /><span style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>{label}</span>
          </button>
        ))}
      </div>

      {tab === 'gallery' && (
        <div>
          <div className="card p-4 mb-4">
            <p className="text-sm font-bold text-slate-700 mb-3" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>নতুন ছবি আপলোড</p>
            <label className="flex flex-col items-center justify-center h-32 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 cursor-pointer mb-3 overflow-hidden">
              {preview ? <img src={preview} className="w-full h-full object-cover" alt="preview" /> : (
                <div className="flex flex-col items-center gap-2"><Upload size={22} className="text-slate-300" />
                  <p className="text-xs text-slate-400" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>ছবি বেছে নিন</p></div>
              )}
              <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files[0]; if (!f) return; setFile(f); setPreview(URL.createObjectURL(f)); }} />
            </label>
            <input value={caption} onChange={e => setCaption(e.target.value)} placeholder="ক্যাপশন (ঐচ্ছিক)" className="input-field mb-3" />
            {preview && (
              <div className="flex gap-2">
                <button onClick={handleUpload} disabled={uploading} className="btn-primary">
                  <span className="flex items-center justify-center gap-2"><Upload size={14}/>{uploading ? 'আপলোড হচ্ছে...' : 'আপলোড করুন'}</span>
                </button>
                <button onClick={() => { setFile(null); setPreview(null); }}
                  className="w-11 h-11 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center flex-shrink-0">
                  <X size={16} className="text-red-500" />
                </button>
              </div>
            )}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {photos.map(p => (
              <div key={p._id} className="relative aspect-square rounded-xl overflow-hidden group">
                <img src={p.url} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-active:opacity-100 flex items-center justify-center transition-opacity">
                  <button onClick={() => delPhoto.mutate(p._id)} className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center">
                    <Trash2 size={14} className="text-white" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'targets' && (
        <div>
          <div className="card p-4 mb-4">
            <p className="text-sm font-bold text-slate-700 mb-3" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>নতুন লক্ষ্য</p>
            <div className="space-y-3">
              <input value={tf.title} onChange={e => setTf({...tf, title: e.target.value})} placeholder="শিরোনাম" className="input-field" />
              <select value={tf.category} onChange={e => setTf({...tf, category: e.target.value})} className="input-field" style={{ background: '#fff' }}>
                {TARGET_CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
              <input type="number" value={tf.goal} onChange={e => setTf({...tf, goal: e.target.value})} placeholder="লক্ষ্যমাত্রা (৳)" className="input-field" />
              <textarea value={tf.description} onChange={e => setTf({...tf, description: e.target.value})} placeholder="বিবরণ (ঐচ্ছিক)" rows={2} className="input-field resize-none" />
              <button onClick={() => addTarget.mutate()} disabled={!tf.title || !tf.goal || addTarget.isPending} className="btn-primary">
                <span className="flex items-center justify-center gap-2"><Plus size={14}/>{addTarget.isPending ? 'তৈরি হচ্ছে...' : 'লক্ষ্য তৈরি করুন'}</span>
              </button>
            </div>
          </div>
          <div className="space-y-3">
            {targets.map(t => {
              const pct = Math.min(Math.round((t.collected / t.goal) * 100), 100);
              return (
                <div key={t._id} className="card p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm font-bold text-slate-800" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>{t.title}</p>
                      <p className="text-xs text-slate-400">{t.category}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold" style={{ color: pct >= 60 ? '#16a34a' : '#ea580c' }}>{pct}%</span>
                      <button onClick={() => delTarget.mutate(t._id)} className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center">
                        <Trash2 size={12} className="text-red-500" />
                      </button>
                    </div>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-100 mb-2">
                    <div className="h-full rounded-full bg-blue-500" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-green-600 font-semibold">৳{t.collected?.toLocaleString()}</span>
                    <span className="text-slate-400">৳{t.goal?.toLocaleString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSettings;
