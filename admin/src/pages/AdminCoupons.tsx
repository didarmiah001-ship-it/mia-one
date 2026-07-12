import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Ticket, Truck } from 'lucide-react';
import { adminFetchCoupons, adminCreateCoupon, adminUpdateCoupon, adminDeleteCoupon, adminFetchAllProducts, fetchCategories } from '../lib/api';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useToast } from '../components/Toast';

const EMPTY: any = {
  name: '',
  code: '',
  type: 'percentage',
  value: '',
  min_order: '',
  max_discount: '',
  max_uses: '',
  usage_limit_per_customer: '',
  starts_at: '',
  expires_at: '',
  applicable_scope: 'all',
  applicable_product_ids: [],
  applicable_category_ids: [],
  free_delivery: false,
  is_active: true,
};

export function AdminCoupons() {
  const toast = useToast();
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  const load = async () => { const c = await adminFetchCoupons(); setCoupons(c); setLoading(false); };
  useEffect(() => {
    load();
    adminFetchAllProducts().then(setProducts);
    fetchCategories().then(setCategories);
  }, []);

  const openCreate = () => { setEditing(null); setForm(EMPTY); setShowForm(true); };
  const openEdit = (c: any) => {
    setEditing(c);
    setForm({
      name: c.name || '',
      code: c.code,
      type: c.type,
      value: String(c.value),
      min_order: c.min_order ? String(c.min_order) : '',
      max_discount: c.max_discount ? String(c.max_discount) : '',
      max_uses: c.max_uses ? String(c.max_uses) : '',
      usage_limit_per_customer: c.usage_limit_per_customer ? String(c.usage_limit_per_customer) : '',
      starts_at: c.starts_at ? c.starts_at.slice(0, 10) : '',
      expires_at: c.expires_at ? c.expires_at.slice(0, 10) : '',
      applicable_scope: c.applicable_scope || 'all',
      applicable_product_ids: c.applicable_product_ids || [],
      applicable_category_ids: c.applicable_category_ids || [],
      free_delivery: c.free_delivery || false,
      is_active: c.is_active,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      ...form,
      name: form.name || form.code,
      value: Number(form.value),
      min_order: form.min_order ? Number(form.min_order) : 0,
      max_discount: form.max_discount ? Number(form.max_discount) : 0,
      max_uses: form.max_uses ? Number(form.max_uses) : null,
      usage_limit_per_customer: form.usage_limit_per_customer ? Number(form.usage_limit_per_customer) : 0,
      starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : new Date().toISOString(),
      expires_at: form.expires_at ? new Date(form.expires_at + 'T23:59:59').toISOString() : null,
    };
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

  const toggleProductId = (id: string) => {
    setForm((f: any) => ({
      ...f,
      applicable_product_ids: f.applicable_product_ids.includes(id)
        ? f.applicable_product_ids.filter((x: string) => x !== id)
        : [...f.applicable_product_ids, id],
    }));
  };

  const toggleCategoryId = (id: string) => {
    setForm((f: any) => ({
      ...f,
      applicable_category_ids: f.applicable_category_ids.includes(id)
        ? f.applicable_category_ids.filter((x: string) => x !== id)
        : [...f.applicable_category_ids, id],
    }));
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
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(123,44,255,0.08)', border: '1px solid rgba(123,44,255,0.2)' }}>
                    <Ticket size={16} className="text-mia-purple" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-white font-mono">{c.code}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-mia-purple/10 text-mia-purple border border-mia-purple/20">
                        {c.type === 'percentage' ? `${c.value}%` : `৳${c.value}`}
                      </span>
                      {c.free_delivery && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-green-500/10 text-green-400 border border-green-500/20 flex items-center gap-0.5">
                          <Truck size={9} /> Free Delivery
                        </span>
                      )}
                      {c.expires_at && new Date(c.expires_at) < new Date() && (
                        <span className="text-[10px] text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded-md border border-red-500/20">Expired</span>
                      )}
                    </div>
                    <p className="text-[10px] text-white/35 mt-0.5">
                      {c.name && c.name !== c.code && `${c.name} · `}
                      Min: ৳{c.min_order || 0}
                      {c.max_discount ? ` · Max: ৳${c.max_discount}` : ''}
                      {c.usage_limit_per_customer ? ` · ${c.usage_limit_per_customer}x/customer` : ''}
                      {' · '}Used: {c.used_count}{c.max_uses ? `/${c.max_uses}` : ''}
                      {c.expires_at ? ` · Exp: ${new Date(c.expires_at).toLocaleDateString()}` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
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
        <div className="fixed inset-0 z-[9980] flex items-center justify-center p-4 overflow-y-auto">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="relative w-full max-w-lg rounded-3xl p-6 my-8" style={{ background: 'linear-gradient(145deg, #141820, #0D1117)', border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 24px 60px rgba(0,0,0,0.5)' }}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2"><Ticket size={16} className="text-mia-purple" /><h3 className="text-base font-bold text-white">{editing ? 'Edit Coupon' : 'New Coupon'}</h3></div>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10"><X size={14} className="text-white/60" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
              {/* Name + Code */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-white/40 block mb-1">Coupon Name</label>
                  <input value={form.name} onChange={e => setForm((f: any) => ({ ...f, name: e.target.value }))} placeholder="Summer Sale" className="admin-input" />
                </div>
                <div>
                  <label className="text-[10px] text-white/40 block mb-1">Coupon Code</label>
                  <input required value={form.code} onChange={e => setForm((f: any) => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="SUMMER20" className="admin-input font-mono tracking-wider" />
                </div>
              </div>

              {/* Type + Value */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-white/40 block mb-1">Discount Type</label>
                  <select value={form.type} onChange={e => setForm((f: any) => ({ ...f, type: e.target.value }))} className="admin-input">
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed (৳)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-white/40 block mb-1">Discount Value</label>
                  <input required type="number" value={form.value} onChange={e => setForm((f: any) => ({ ...f, value: e.target.value }))} placeholder={form.type === 'percentage' ? '20' : '100'} className="admin-input" />
                </div>
              </div>

              {/* Min Order + Max Discount */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-white/40 block mb-1">Min Order (৳)</label>
                  <input type="number" value={form.min_order} onChange={e => setForm((f: any) => ({ ...f, min_order: e.target.value }))} placeholder="500" className="admin-input" />
                </div>
                <div>
                  <label className="text-[10px] text-white/40 block mb-1">Max Discount (৳)</label>
                  <input type="number" value={form.max_discount} onChange={e => setForm((f: any) => ({ ...f, max_discount: e.target.value }))} placeholder="200" className="admin-input" />
                </div>
              </div>

              {/* Usage Limits */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-white/40 block mb-1">Total Usage Limit</label>
                  <input type="number" value={form.max_uses} onChange={e => setForm((f: any) => ({ ...f, max_uses: e.target.value }))} placeholder="Unlimited" className="admin-input" />
                </div>
                <div>
                  <label className="text-[10px] text-white/40 block mb-1">Per Customer Limit</label>
                  <input type="number" value={form.usage_limit_per_customer} onChange={e => setForm((f: any) => ({ ...f, usage_limit_per_customer: e.target.value }))} placeholder="Unlimited" className="admin-input" />
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-white/40 block mb-1">Start Date</label>
                  <input type="date" value={form.starts_at} onChange={e => setForm((f: any) => ({ ...f, starts_at: e.target.value }))} className="admin-input" />
                </div>
                <div>
                  <label className="text-[10px] text-white/40 block mb-1">End Date</label>
                  <input type="date" value={form.expires_at} onChange={e => setForm((f: any) => ({ ...f, expires_at: e.target.value }))} className="admin-input" />
                </div>
              </div>

              {/* Applicable Scope */}
              <div>
                <label className="text-[10px] text-white/40 block mb-1">Applicable Products</label>
                <select value={form.applicable_scope} onChange={e => setForm((f: any) => ({ ...f, applicable_scope: e.target.value }))} className="admin-input">
                  <option value="all">All Products</option>
                  <option value="products">Selected Products</option>
                  <option value="categories">Selected Categories</option>
                </select>
              </div>

              {/* Product Picker */}
              {form.applicable_scope === 'products' && (
                <div className="max-h-32 overflow-y-auto rounded-xl p-2 space-y-1" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  {products.map(p => (
                    <label key={p.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 cursor-pointer">
                      <input type="checkbox" checked={form.applicable_product_ids.includes(p.id)} onChange={() => toggleProductId(p.id)} className="admin-checkbox" />
                      <span className="text-xs text-white/70 truncate">{p.name}</span>
                    </label>
                  ))}
                </div>
              )}

              {/* Category Picker */}
              {form.applicable_scope === 'categories' && (
                <div className="max-h-32 overflow-y-auto rounded-xl p-2 space-y-1" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  {categories.map(c => (
                    <label key={c.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 cursor-pointer">
                      <input type="checkbox" checked={form.applicable_category_ids.includes(c.id)} onChange={() => toggleCategoryId(c.id)} className="admin-checkbox" />
                      <span className="text-xs text-white/70">{c.name}</span>
                    </label>
                  ))}
                </div>
              )}

              {/* Free Delivery */}
              <label className="flex items-center gap-2 cursor-pointer px-3 py-2.5 rounded-xl" style={{ background: form.free_delivery ? 'rgba(34,197,94,0.06)' : 'rgba(255,255,255,0.02)', border: form.free_delivery ? '1px solid rgba(34,197,94,0.2)' : '1px solid rgba(255,255,255,0.06)' }}>
                <input type="checkbox" checked={form.free_delivery} onChange={e => setForm((f: any) => ({ ...f, free_delivery: e.target.checked }))} className="admin-checkbox" />
                <Truck size={14} className={form.free_delivery ? 'text-green-400' : 'text-white/40'} />
                <span className="text-xs text-white/70">Free Delivery Coupon</span>
              </label>

              {/* Active */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_active} onChange={e => setForm((f: any) => ({ ...f, is_active: e.target.checked }))} className="admin-checkbox" />
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
