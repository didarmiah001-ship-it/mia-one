import { useState, useEffect } from 'react';
import { Plus, Trash2, X, Zap, Clock } from 'lucide-react';
import { adminFetchFlashSales, adminCreateFlashSale, adminUpdateFlashSale, adminDeleteFlashSale, fetchProducts } from '../lib/api';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useToast } from '../components/Toast';

const toDatetimeLocal = (iso: string) => new Date(iso).toISOString().slice(0, 16);
const nowPlus = (hours: number) => new Date(Date.now() + hours * 3_600_000).toISOString().slice(0, 16);

const EMPTY = { product_id: '', sale_price: '', original_price: '', starts_at: toDatetimeLocal(new Date().toISOString()), ends_at: nowPlus(24), is_active: true };

export function AdminFlashSale() {
  const toast = useToast();
  const [sales, setSales] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<any>(null);

  const load = async () => {
    const [s, p] = await Promise.all([adminFetchFlashSales(), fetchProducts()]);
    setSales(s);
    setProducts(p);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const handleProductChange = (pid: string) => {
    const p = products.find(pr => pr.id === pid);
    setForm(f => ({ ...f, product_id: pid, original_price: p ? String(p.price) : '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = { ...form, sale_price: Number(form.sale_price), original_price: Number(form.original_price) };
    const { error } = await adminCreateFlashSale(payload);
    if (error) toast.error(error); else { toast.success('Flash sale created'); setShowForm(false); await load(); }
    setSaving(false);
  };

  const handleToggle = async (id: string, is_active: boolean) => {
    await adminUpdateFlashSale(id, { is_active });
    await load();
    toast.success(is_active ? 'Sale activated' : 'Sale paused');
  };

  const handleDelete = async (id: string) => {
    const { error } = await adminDeleteFlashSale(id);
    if (error) toast.error(error); else { toast.success('Flash sale removed'); await load(); }
    setConfirmDelete(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-white">Flash Sales <span className="text-white/30 text-sm font-normal">({sales.length})</span></h2>
        <button onClick={() => { setForm(EMPTY); setShowForm(true); }} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white glow-btn" style={{ background: 'linear-gradient(135deg, #FF8A00, #FF2EC9)' }}>
          <Plus size={14} /> New Sale
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="glow-card h-20 shimmer" />)}</div>
      ) : (
        <div className="space-y-3">
          {sales.length === 0 && <div className="text-center py-12 text-white/25 text-sm">No flash sales yet</div>}
          {sales.map(s => {
            const now = Date.now();
            const end = new Date(s.ends_at).getTime();
            const isExpired = end < now;
            const pct = s.original_price > 0 ? Math.round(((s.original_price - s.sale_price) / s.original_price) * 100) : 0;
            return (
              <div key={s.id} className="glow-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {s.products?.image && <img src={s.products.image} alt="" className="w-12 h-12 rounded-xl object-cover bg-mia-navy" />}
                    <div>
                      <p className="text-sm font-semibold text-white">{s.products?.name || 'Product'}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm font-bold text-mia-orange">৳{s.sale_price}</span>
                        <span className="text-xs text-white/30 line-through">৳{s.original_price}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-mia-pink/10 text-mia-pink border border-mia-pink/20">-{pct}%</span>
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <Clock size={10} className="text-white/30" />
                        <span className="text-[10px] text-white/30">{isExpired ? 'Expired' : `Ends ${new Date(s.ends_at).toLocaleDateString()}`}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleToggle(s.id, !s.is_active)}
                      className="text-[10px] px-2.5 py-1 rounded-lg font-medium transition-all"
                      style={s.is_active ? { color: '#22c55e', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' } : { color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                      {s.is_active ? 'Active' : 'Paused'}
                    </button>
                    <button onClick={() => setConfirmDelete(s)} className="w-8 h-8 rounded-lg bg-red-500/5 flex items-center justify-center hover:bg-red-500/10">
                      <Trash2 size={13} className="text-red-400/60" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-[9980] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="relative w-full max-w-sm rounded-3xl p-6" style={{ background: 'linear-gradient(145deg, #141820, #0D1117)', border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 24px 60px rgba(0,0,0,0.5)' }}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2"><Zap size={16} className="text-mia-orange" /><h3 className="text-base font-bold text-white">New Flash Sale</h3></div>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10"><X size={14} className="text-white/60" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <select required value={form.product_id} onChange={e => handleProductChange(e.target.value)} className="admin-input">
                <option value="">Select Product</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name} (৳{p.price})</option>)}
              </select>
              <div className="grid grid-cols-2 gap-3">
                <input required type="number" value={form.sale_price} onChange={e => setForm(f => ({ ...f, sale_price: e.target.value }))} placeholder="Sale Price (৳)" className="admin-input" />
                <input required type="number" value={form.original_price} onChange={e => setForm(f => ({ ...f, original_price: e.target.value }))} placeholder="Original Price (৳)" className="admin-input" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] text-white/40 mb-1">Starts At</p>
                  <input type="datetime-local" value={form.starts_at} onChange={e => setForm(f => ({ ...f, starts_at: e.target.value }))} className="admin-input" />
                </div>
                <div>
                  <p className="text-[10px] text-white/40 mb-1">Ends At</p>
                  <input type="datetime-local" value={form.ends_at} onChange={e => setForm(f => ({ ...f, ends_at: e.target.value }))} className="admin-input" />
                </div>
              </div>
              <button type="submit" disabled={saving} className="w-full py-3 rounded-2xl text-sm font-semibold text-white glow-btn disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #FF8A00, #FF2EC9)' }}>
                {saving ? 'Creating...' : 'Create Flash Sale'}
              </button>
            </form>
          </div>
        </div>
      )}
      {confirmDelete && <ConfirmDialog title="Remove Flash Sale" message="Remove this flash sale? The product price will not be changed." confirmLabel="Remove" danger onConfirm={() => handleDelete(confirmDelete.id)} onCancel={() => setConfirmDelete(null)} />}
    </div>
  );
}
