import { useState, useEffect } from 'react';
import { adminFetchReviews, adminUpdateReview, adminDeleteReview } from '../lib/api';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useToast } from '../components/Toast';
import { Search, Star, CheckCircle2, XCircle, Trash2 } from 'lucide-react';

export function AdminReviews() {
  const toast = useToast();
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<any>(null);

  const load = async () => { const r = await adminFetchReviews(); setReviews(r); setLoading(false); };
  useEffect(() => { load(); }, []);

  const handleApprove = async (id: string, val: boolean) => {
    const { error } = await adminUpdateReview(id, val);
    if (error) toast.error(error); else { toast.success(val ? 'Review approved' : 'Review hidden'); await load(); }
  };

  const handleDelete = async (id: string) => {
    const { error } = await adminDeleteReview(id);
    if (error) toast.error(error); else { toast.success('Review deleted'); await load(); }
    setConfirmDelete(null);
  };

  const filtered = reviews.filter(r => !search ||
    (r.profiles?.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (r.products?.name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-between">
        <h2 className="text-base font-bold text-white">Reviews <span className="text-white/30 text-sm font-normal">({filtered.length})</span></h2>
        <div className="relative w-full sm:w-56">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search reviews..." className="w-full pl-9 pr-3 py-2 bg-white/[0.03] border border-white/8 rounded-xl text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-mia-orange/40" />
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="glow-card h-20 shimmer" />)}</div>
      ) : (
        <div className="space-y-3">
          {filtered.length === 0 && <div className="text-center py-12 text-white/25 text-sm">No reviews found</div>}
          {filtered.map(r => (
            <div key={r.id} className="glow-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} size={11} className={i < r.rating ? 'fill-mia-orange text-mia-orange' : 'text-white/15'} />
                      ))}
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-lg font-medium ${r.is_approved ? 'text-green-400 bg-green-500/10 border border-green-500/20' : 'text-white/30 bg-white/5 border border-white/8'}`}>
                      {r.is_approved ? 'Approved' : 'Hidden'}
                    </span>
                  </div>
                  <p className="text-sm text-white/80">{r.comment || '—'}</p>
                  <p className="text-xs text-white/35 mt-1">
                    <span className="font-medium text-white/50">{r.profiles?.full_name || 'User'}</span>
                    {' on '}
                    <span className="text-mia-orange/70">{r.products?.name || 'Product'}</span>
                    {' · ' + new Date(r.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => handleApprove(r.id, !r.is_approved)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                    style={{ background: r.is_approved ? 'rgba(239,68,68,0.05)' : 'rgba(34,197,94,0.05)' }}>
                    {r.is_approved ? <XCircle size={15} className="text-red-400/60" /> : <CheckCircle2 size={15} className="text-green-400/60" />}
                  </button>
                  <button onClick={() => setConfirmDelete(r)} className="w-8 h-8 rounded-lg bg-red-500/5 flex items-center justify-center hover:bg-red-500/10">
                    <Trash2 size={13} className="text-red-400/60" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {confirmDelete && <ConfirmDialog title="Delete Review" message="Permanently delete this review?" confirmLabel="Delete" danger onConfirm={() => handleDelete(confirmDelete.id)} onCancel={() => setConfirmDelete(null)} />}
    </div>
  );
}
