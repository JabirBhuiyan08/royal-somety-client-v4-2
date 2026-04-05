// client/src/components/DepositModal.jsx
import { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import useAxios from '../hooks/useAxios';
import Modal from './Modal';
import { DollarSign, FileText, CheckCircle, Target } from 'lucide-react';
import toast from 'react-hot-toast';

const QUICK_AMOUNTS = [500, 1000, 2000, 5000, 10000];

const DepositModal = ({ isOpen, onClose }) => {
  const axios = useAxios();
  const qc = useQueryClient();
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [selectedTarget, setSelectedTarget] = useState('');
  const [success, setSuccess] = useState(false);

  const { data: targets = [] } = useQuery({
    queryKey: ['targets'],
    queryFn: () => axios.get('/member/targets').then(r => r.data.targets),
    enabled: isOpen,
  });

  const mutation = useMutation({
    mutationFn: (data) => axios.post('/member/transactions/deposit', data),
    onSuccess: () => {
      qc.invalidateQueries(['transactions']);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setAmount('');
        setNote('');
        onClose();
      }, 2000);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'অনুরোধ ব্যর্থ হয়েছে');
    },
  });

  const handleSubmit = () => {
    const num = Number(amount);
    if (!num || num < 10) { toast.error('কমপক্ষে ১০ টাকা জমা দিতে হবে'); return; }
    mutation.mutate({ 
      amount: num, 
      note, 
      target: selectedTarget || null 
    });
  };

  const inputStyle = {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(226,185,111,0.2)',
    color: '#f0f0f0',
    fontFamily: "'Hind Siliguri', sans-serif",
  };

  if (success) return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col items-center py-8 gap-4">
        <div className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(74,222,128,0.15)', border: '2px solid rgba(74,222,128,0.4)' }}>
          <CheckCircle size={32} className="text-green-400" />
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-white" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>
            অনুরোধ পাঠানো হয়েছে!
          </p>
          <p className="text-sm text-slate-400 mt-1" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>
            অ্যাডমিন অনুমোদনের পর ব্যালেন্স যোগ হবে
          </p>
        </div>
      </div>
    </Modal>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="টাকা জমার অনুরোধ">
      <div className="space-y-4">
        {/* Quick amounts */}
        <div>
          <p className="text-xs text-slate-400 mb-2" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>
            দ্রুত পরিমাণ নির্বাচন
          </p>
          <div className="flex flex-wrap gap-2">
            {QUICK_AMOUNTS.map((a) => (
              <button key={a} onClick={() => setAmount(String(a))}
                className="px-3 py-1.5 rounded-xl text-sm font-medium transition-all active:scale-95"
                style={amount === String(a)
                  ? { background: 'linear-gradient(135deg, #e2b96f, #c9a55a)', color: '#1a1a2e' }
                  : { background: 'rgba(226,185,111,0.1)', border: '1px solid rgba(226,185,111,0.2)', color: '#e2b96f' }
                }>
                ৳{a.toLocaleString()}
              </button>
            ))}
          </div>
        </div>

        {/* Custom amount */}
        <div>
          <label className="text-xs text-slate-400 mb-1.5 block" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>
            পরিমাণ (টাকায়)
          </label>
          <div className="relative">
            <DollarSign size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-400/60" />
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="পরিমাণ লিখুন"
              className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none"
              style={inputStyle}
              min="10"
            />
          </div>
        </div>

        {/* Note */}
        <div>
          <label className="text-xs text-slate-400 mb-1.5 block" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>
            নোট (ঐচ্ছিক)
          </label>
          <div className="relative">
            <FileText size={16} className="absolute left-3.5 top-3 text-amber-400/60" />
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="যেমন: মাসিক চাঁদা — মার্চ ২০২৪"
              rows={2}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none resize-none"
              style={inputStyle}
            />
          </div>
        </div>

        {/* Target selection */}
        {targets.length > 0 && (
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>
              লক্ষ্যে জমা করুন (ঐচ্ছিক)
            </label>
            <div className="relative">
              <Target size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-400/60" />
              <select
                value={selectedTarget}
                onChange={(e) => setSelectedTarget(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none"
                style={{ ...inputStyle, background: 'rgba(255,255,255,0.05)' }}
              >
                <option value="">কোনো লক্ষ্য নেই</option>
                {targets.map(t => (
                  <option key={t._id} value={t._id}>
                    {t.title} — ৳{t.goal?.toLocaleString()}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Info banner */}
        <div className="flex gap-2 p-3 rounded-xl"
          style={{ background: 'rgba(226,185,111,0.06)', border: '1px solid rgba(226,185,111,0.15)' }}>
          <span className="text-amber-400 flex-shrink-0 mt-0.5">ℹ️</span>
          <p className="text-xs text-slate-400 leading-relaxed" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>
            অনুরোধ পাঠানোর পর অ্যাডমিন যাচাই করে অনুমোদন দেবেন। অনুমোদনের পরেই ব্যালেন্সে যোগ হবে।
          </p>
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={mutation.isPending || !amount}
          className="w-full py-3.5 rounded-xl font-bold text-sm transition-all active:scale-95 flex items-center justify-center gap-2"
          style={{
            background: amount ? 'linear-gradient(135deg, #e2b96f, #c9a55a)' : 'rgba(226,185,111,0.2)',
            color: amount ? '#1a1a2e' : '#6b7280',
            fontFamily: "'Hind Siliguri', sans-serif",
          }}
        >
          {mutation.isPending ? (
            <>
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              পাঠানো হচ্ছে...
            </>
          ) : (
            `৳${Number(amount || 0).toLocaleString()} জমার অনুরোধ পাঠান`
          )}
        </button>
      </div>
    </Modal>
  );
};

export default DepositModal;
