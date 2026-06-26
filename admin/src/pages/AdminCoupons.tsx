import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Ticket } from 'lucide-react';
import { adminFetchCoupons, adminCreateCoupon, adminUpdateCoupon, adminDeleteCoupon } from '../lib/api';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useToast } from '../components/Toast';

const EMPTY = { code: '', type: 'percentage', value: '', min_order: '', max_uses: '', is_active: true, expires_at: '' };

export function AdminCoupons() {
  const toast = useToast();
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<any>(null);

  const load = async () => { const c = await adminFetchCoupons(); setCoupons(c); setLoading(false); };
  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm(EMPTY); setShowForm(true); };
  const openEdit = (c: any) => {
    setEditing(c);
    setForm({ code: c.code, type: c.type, value: String(c.value), min_order: c.min_order ? String(c.min_order) : '', max_uses: c.max_uses ? String(c.max_uses) : '', is_active: c.is_active, expires_at: c.expires_at ? c.expires_at.slice(0, 10) : '' });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = { ...form, value: Number(form.value), min_order: form.min_order ? Number(form.min_order) : 0, max_uses: form.max_uses ? Number(form.max_uses) : null, expires_at: form.expires_at || null };
    if (editing) {
      const { error } = await adminUpdateCoupon(editing.id, payload);
      if (error) toast.error(error); else { toast.success('Coupon updated'); setShowForm(false); await load(); }
    } else {
      const { error } = await adminCreateCoupon(payload);
      if (error) toast.error(error); else { toast.success('Coupon created'); setShowForm(false); await load(); }
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await adminDeleteCoupon(id);
    if (error) toast.error(error); else { toast.success('Coupon deleted'); await load(); }
    setConfirmDelete(null);
  };

  const handleToggle = async (c: any) => {
    await adminUpdateCoupon(c.id, { is_active: !c.is_active });
    await load();
    toast.success(c.is_active ? 'Coupon deactivated' : 'Coupon activated');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-white">Coupons <span className="text-white/30 text-sm font-normal">({coupons.length})</span></h2>
        <button onClick={openCreate} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white glow-btn" style={{ background: 'linear-gradient(135deg, #FF8A00, #FF2EC9)' }}>
          <Plus size={14} /> Add Coupon
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="glow-card h-16 shimmer" />)}</div>
      ) : (
        <div className="space-y-2">
          {coupons.length === 0 && <div className="text-center py-12 text-white/25 text-sm">No coupons yet</div>}
          {coupons.map(c => (
            <div key={c.id} className="glow-card p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(123,44,255,0.08)', border: '1px solid rgba(123,44,255,0.2)' }}>
                    <Ticket size={16} className="text-mia-purple" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white font-mono">{c.code}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-mia-purple/10 text-mia-purple border border-mia-purple/20">
                        {c.type === 'percentage' ? `${c.value}%` : `৳${c.value}`}
                      </span>
                      {c.expires_at && new Date(c.expires_at) < new Date() && (
                        <span className="text-[10px] text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded-md border border-red-500/20">Expired</span>
                      )}
                    </div>
                    <p className="text-[10px] text-white/35">
                      Min order: ৳{c.min_order || 0} · Used: {c.used_count}{c.max_uses ? `/${c.max_uses}` : ''}
                      {c.expires_at ? ` · Exp: ${new Date(c.expires_at).toLocaleDateString()}` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleToggle(c)}
                    className="text-[10px] px-2.5 py-1 rounded-lg font-medium"
                    style={c.is_active ? { color: '#22c55e', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' } : { color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    {c.is_active ? 'Active' : 'Off'}
                  </button>
                  <button onClick={() => openEdit(c)} className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10"><Edit2 size={13} className="text-white/50" /></button>
                  <button onClick={() => setConfirmDelete(c)} className="w-8 h-8 rounded-lg bg-red-500/5 flex items-center justify-center hover:bg-red-500/10"><Trash2 size={13} className="text-red-400/60" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-[9980] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="relative w-full max-w-sm rounded-3xl p-6" style={{ background: 'linear-gradient(145deg, #141820, #0D1117)', border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 24px 60px rgba(0,0,0,0.5)' }}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2"><Ticket size={16} className="text-mia-purple" /><h3 className="text-base font-bold text-white">{editing ? 'Edit Coupon' : 'New Coupon'}</h3></div>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10"><X size={14} className="text-white/60" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input required value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="COUPON CODE" className="admin-input font-mono tracking-wider" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="admin-input">
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed (৳)</option>
                </select>
                <input required type="number" value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} placeholder={form.type === 'percentage' ? 'e.g. 20' : 'e.g. 100'} className="admin-input" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input type="number" value={form.min_order} onChange={e => setForm(f => ({ ...f, min_order: e.target.value }))} placeholder="Min Order (৳)" className="admin-input" />
                <input type="number" value={form.max_uses} onChange={e => setForm(f => ({ ...f, max_uses: e.target.value }))} placeholder="Max Uses (optional)" className="admin-input" />
              </div>
              <div>
                <p className="text-[10px] text-white/40 mb-1">Expiry Date (optional)</p>
                <input type="date" value={form.expires_at} onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))} className="admin-input" />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} className="admin-checkbox" />
                <span className="text-xs text-white/60">Active</span>
              </label>
              <button type="submit" disabled={saving} className="w-full py-3 rounded-2xl text-sm font-semibold text-white glow-btn disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #7B2CFF, #FF2EC9)' }}>
                {saving ? 'Saving...' : editing ? 'Update Coupon' : 'Create Coupon'}
              </button>
            </form>
          </div>
        </div>
      )}
      {confirmDelete && <ConfirmDialog title="Delete Coupon" message={`Delete coupon "${confirmDelete.code}"?`} confirmLabel="Delete" danger onConfirm={() => handleDelete(confirmDelete.id)} onCancel={() => setConfirmDelete(null)} />}
    </div>
  );
}
