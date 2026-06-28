import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Megaphone, Calendar, Percent, DollarSign, Image as ImageIcon, Upload } from 'lucide-react';
import { adminFetchMarketingCampaigns, adminCreateMarketingCampaign, adminUpdateMarketingCampaign, adminDeleteMarketingCampaign, adminUploadCampaignBanner, adminFetchAllProducts, fetchCategories } from '../lib/api';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useToast } from '../components/Toast';

const EMPTY: any = {
  name: '',
  banner_url: '',
  banner_mobile_url: '',
  start_date: '',
  end_date: '',
  discount_type: 'percentage',
  discount_value: '',
  applicable_scope: 'all',
  applicable_product_ids: [],
  applicable_category_ids: [],
  coupon_code: '',
  is_active: true,
  sort_order: 0,
};

export function AdminCampaigns() {
  const toast = useToast();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  const load = async () => { const c = await adminFetchMarketingCampaigns(); setCampaigns(c); setLoading(false); };
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
      banner_url: c.banner_url || '',
      banner_mobile_url: c.banner_mobile_url || '',
      start_date: c.start_date ? c.start_date.slice(0, 10) : '',
      end_date: c.end_date ? c.end_date.slice(0, 10) : '',
      discount_type: c.discount_type || 'percentage',
      discount_value: c.discount_value ? String(c.discount_value) : '',
      applicable_scope: c.applicable_scope || 'all',
      applicable_product_ids: c.applicable_product_ids || [],
      applicable_category_ids: c.applicable_category_ids || [],
      coupon_code: c.coupon_code || '',
      is_active: c.is_active,
      sort_order: c.sort_order || 0,
    });
    setShowForm(true);
  };

  const handleUpload = async (file: File, field: 'banner_url' | 'banner_mobile_url') => {
    setUploading(true);
    const { url, error } = await adminUploadCampaignBanner(file);
    if (error) toast.error(error);
    else setForm((f: any) => ({ ...f, [field]: url }));
    setUploading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      ...form,
      discount_value: Number(form.discount_value) || 0,
      start_date: form.start_date ? new Date(form.start_date).toISOString() : new Date().toISOString(),
      end_date: form.end_date ? new Date(form.end_date + 'T23:59:59').toISOString() : null,
      sort_order: Number(form.sort_order) || 0,
    };
    if (editing) {
      const { error } = await adminUpdateMarketingCampaign(editing.id, payload);
      if (error) toast.error(error); else { toast.success('Campaign updated'); setShowForm(false); await load(); }
    } else {
      const { error } = await adminCreateMarketingCampaign(payload);
      if (error) toast.error(error); else { toast.success('Campaign created'); setShowForm(false); await load(); }
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await adminDeleteMarketingCampaign(id);
    if (error) toast.error(error); else { toast.success('Campaign deleted'); await load(); }
    setConfirmDelete(null);
  };

  const handleToggle = async (c: any) => {
    await adminUpdateMarketingCampaign(c.id, { is_active: !c.is_active });
    await load();
    toast.success(c.is_active ? 'Campaign deactivated' : 'Campaign activated');
  };

  const toggleProductId = (id: string) => setForm((f: any) => ({ ...f, applicable_product_ids: f.applicable_product_ids.includes(id) ? f.applicable_product_ids.filter((x: string) => x !== id) : [...f.applicable_product_ids, id] }));
  const toggleCategoryId = (id: string) => setForm((f: any) => ({ ...f, applicable_category_ids: f.applicable_category_ids.includes(id) ? f.applicable_category_ids.filter((x: string) => x !== id) : [...f.applicable_category_ids, id] }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-white">Campaigns <span className="text-white/30 text-sm font-normal">({campaigns.length})</span></h2>
        <button onClick={openCreate} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white glow-btn" style={{ background: 'linear-gradient(135deg, #FF8A00, #FF2EC9)' }}>
          <Plus size={14} /> Add Campaign
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="glow-card h-20 shimmer" />)}</div>
      ) : (
        <div className="space-y-2">
          {campaigns.length === 0 && <div className="text-center py-12 text-white/25 text-sm">No campaigns yet</div>}
          {campaigns.map(c => {
            const now = new Date();
            const ended = c.end_date && new Date(c.end_date) < now;
            const started = !c.start_date || new Date(c.start_date) <= now;
            return (
              <div key={c.id} className="glow-card p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {c.banner_url ? (
                      <img src={c.banner_url} alt={c.name} className="w-16 h-12 rounded-lg object-cover shrink-0" />
                    ) : (
                      <div className="w-16 h-12 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(255,138,0,0.06)', border: '1px solid rgba(255,138,0,0.15)' }}>
                        <Megaphone size={16} className="text-mia-orange/50" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-white truncate">{c.name}</span>
                        {c.discount_value > 0 && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-mia-orange/10 text-mia-orange border border-mia-orange/20">
                            {c.discount_type === 'percentage' ? `${c.discount_value}%` : `৳${c.discount_value}`}
                          </span>
                        )}
                        {ended && <span className="text-[10px] text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded-md border border-red-500/20">Ended</span>}
                        {!ended && !started && <span className="text-[10px] text-yellow-400 bg-yellow-500/10 px-1.5 py-0.5 rounded-md border border-yellow-500/20">Upcoming</span>}
                        {c.coupon_code && <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-mia-purple/10 text-mia-purple border border-mia-purple/20 font-mono">{c.coupon_code}</span>}
                      </div>
                      <p className="text-[10px] text-white/35 mt-0.5">
                        {c.start_date ? new Date(c.start_date).toLocaleDateString() : 'Now'} → {c.end_date ? new Date(c.end_date).toLocaleDateString() : 'No end'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => handleToggle(c)} className="text-[10px] px-2.5 py-1 rounded-lg font-medium"
                      style={c.is_active ? { color: '#22c55e', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' } : { color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      {c.is_active ? 'Active' : 'Off'}
                    </button>
                    <button onClick={() => openEdit(c)} className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10"><Edit2 size={13} className="text-white/50" /></button>
                    <button onClick={() => setConfirmDelete(c)} className="w-8 h-8 rounded-lg bg-red-500/5 flex items-center justify-center hover:bg-red-500/10"><Trash2 size={13} className="text-red-400/60" /></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-[9980] flex items-center justify-center p-4 overflow-y-auto">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="relative w-full max-w-lg rounded-3xl p-6 my-8" style={{ background: 'linear-gradient(145deg, #141820, #0D1117)', border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 24px 60px rgba(0,0,0,0.5)' }}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2"><Megaphone size={16} className="text-mia-orange" /><h3 className="text-base font-bold text-white">{editing ? 'Edit Campaign' : 'New Campaign'}</h3></div>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10"><X size={14} className="text-white/60" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
              <div>
                <label className="text-[10px] text-white/40 block mb-1">Campaign Name</label>
                <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Eid Sale 2026" className="admin-input" />
              </div>

              {/* Banner Upload */}
              <div>
                <label className="text-[10px] text-white/40 block mb-1">Campaign Banner (Desktop)</label>
                {form.banner_url ? (
                  <div className="relative group">
                    <img src={form.banner_url} alt="banner" className="w-full h-32 rounded-xl object-cover" />
                    <button type="button" onClick={() => setForm(f => ({ ...f, banner_url: '' }))} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center"><X size={12} className="text-white" /></button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center h-32 rounded-xl cursor-pointer hover:bg-white/5 transition-colors" style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)' }}>
                    {uploading ? <span className="text-xs text-white/40">Uploading...</span> : (<><Upload size={18} className="text-white/30 mb-1" /><span className="text-[10px] text-white/30">Click to upload</span></>)}
                    <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0], 'banner_url')} />
                  </label>
                )}
              </div>

              {/* Discount Type + Value */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-white/40 block mb-1">Discount Type</label>
                  <select value={form.discount_type} onChange={e => setForm(f => ({ ...f, discount_type: e.target.value }))} className="admin-input">
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed (৳)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-white/40 block mb-1">Discount Value</label>
                  <input type="number" value={form.discount_value} onChange={e => setForm(f => ({ ...f, discount_value: e.target.value }))} placeholder="20" className="admin-input" />
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-white/40 block mb-1">Start Date</label>
                  <input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} className="admin-input" />
                </div>
                <div>
                  <label className="text-[10px] text-white/40 block mb-1">End Date</label>
                  <input type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} className="admin-input" />
                </div>
              </div>

              {/* Applicable Scope */}
              <div>
                <label className="text-[10px] text-white/40 block mb-1">Applicable Products</label>
                <select value={form.applicable_scope} onChange={e => setForm(f => ({ ...f, applicable_scope: e.target.value }))} className="admin-input">
                  <option value="all">All Products</option>
                  <option value="products">Selected Products</option>
                  <option value="categories">Selected Categories</option>
                </select>
              </div>

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

              {/* Coupon Code */}
              <div>
                <label className="text-[10px] text-white/40 block mb-1">Linked Coupon Code (Optional)</label>
                <input value={form.coupon_code} onChange={e => setForm(f => ({ ...f, coupon_code: e.target.value.toUpperCase() }))} placeholder="EID20" className="admin-input font-mono tracking-wider" />
              </div>

              {/* Active */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} className="admin-checkbox" />
                <span className="text-xs text-white/60">Active</span>
              </label>

              <button type="submit" disabled={saving} className="w-full py-3 rounded-2xl text-sm font-semibold text-white glow-btn disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #FF8A00, #FF2EC9)' }}>
                {saving ? 'Saving...' : editing ? 'Update Campaign' : 'Create Campaign'}
              </button>
            </form>
          </div>
        </div>
      )}
      {confirmDelete && <ConfirmDialog title="Delete Campaign" message={`Delete campaign "${confirmDelete.name}"?`} confirmLabel="Delete" danger onConfirm={() => handleDelete(confirmDelete.id)} onCancel={() => setConfirmDelete(null)} />}
    </div>
  );
}
