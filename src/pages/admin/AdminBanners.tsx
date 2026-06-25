import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Image, Calendar, ArrowUp, ArrowDown } from 'lucide-react';
import { adminFetchBanners, adminCreateBanner, adminUpdateBanner, adminDeleteBanner } from '../../lib/api';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { useToast } from '../../components/Toast';

const EMPTY = {
  title: '',
  subtitle: '',
  color: '#FF8A00',
  desktop_image: '',
  mobile_image: '',
  button_text: 'Shop Now',
  button_link: '',
  priority: 0,
  starts_at: '',
  ends_at: '',
  is_active: true,
};

const COLORS = ['#FF8A00', '#FF2EC9', '#7B2CFF', '#00D1FF', '#22c55e', '#f59e0b'];

function StatusBadge({ banner }: { banner: any }) {
  const now = Date.now();
  const start = banner.starts_at ? new Date(banner.starts_at).getTime() : null;
  const end = banner.ends_at ? new Date(banner.ends_at).getTime() : null;

  if (!banner.is_active) return <span className="text-[10px] px-2 py-0.5 rounded-lg text-white/30 bg-white/5 border border-white/8">Inactive</span>;
  if (end && end < now) return <span className="text-[10px] px-2 py-0.5 rounded-lg text-red-400 bg-red-500/10 border border-red-500/20">Expired</span>;
  if (start && start > now) return <span className="text-[10px] px-2 py-0.5 rounded-lg text-yellow-400 bg-yellow-400/10 border border-yellow-400/20">Scheduled</span>;
  return <span className="text-[10px] px-2 py-0.5 rounded-lg text-green-400 bg-green-500/10 border border-green-500/20">Live</span>;
}

export function AdminBanners() {
  const toast = useToast();
  const [banners, setBanners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<any>(null);
  const [previewTab, setPreviewTab] = useState<'desktop' | 'mobile'>('desktop');

  const load = async () => {
    const b = await adminFetchBanners();
    setBanners(b);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY);
    setPreviewTab('desktop');
    setShowForm(true);
  };

  const openEdit = (b: any) => {
    setEditing(b);
    setForm({
      title: b.title,
      subtitle: b.subtitle || '',
      color: b.color || '#FF8A00',
      desktop_image: b.desktop_image || b.image_url || '',
      mobile_image: b.mobile_image || '',
      button_text: b.button_text || 'Shop Now',
      button_link: b.button_link || b.link_url || '',
      priority: b.priority || 0,
      starts_at: b.starts_at ? b.starts_at.slice(0, 16) : '',
      ends_at: b.ends_at ? b.ends_at.slice(0, 16) : '',
      is_active: b.is_active,
    });
    setPreviewTab('desktop');
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      ...form,
      image_url: form.desktop_image,
      link_url: form.button_link,
      sort_order: form.priority,
      starts_at: form.starts_at || null,
      ends_at: form.ends_at || null,
    };
    if (editing) {
      const { error } = await adminUpdateBanner(editing.id, payload);
      if (error) toast.error(error); else { toast.success('Banner updated'); setShowForm(false); await load(); }
    } else {
      const { error } = await adminCreateBanner(payload);
      if (error) toast.error(error); else { toast.success('Banner created'); setShowForm(false); await load(); }
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await adminDeleteBanner(id);
    if (error) toast.error(error); else { toast.success('Banner deleted'); await load(); }
    setConfirmDelete(null);
  };

  const handleToggle = async (b: any) => {
    await adminUpdateBanner(b.id, { is_active: !b.is_active });
    await load();
    toast.success(b.is_active ? 'Banner disabled' : 'Banner enabled');
  };

  const handlePriority = async (b: any, direction: 'up' | 'down') => {
    const newPriority = direction === 'up' ? b.priority + 1 : Math.max(0, b.priority - 1);
    await adminUpdateBanner(b.id, { priority: newPriority });
    await load();
  };

  const previewImage = previewTab === 'desktop' ? form.desktop_image : form.mobile_image;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-white">
          Hero Banners <span className="text-white/30 text-sm font-normal">({banners.length})</span>
        </h2>
        <button onClick={openCreate} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white glow-btn" style={{ background: 'linear-gradient(135deg, #FF8A00, #FF2EC9)' }}>
          <Plus size={14} /> Add Banner
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="glow-card h-28 shimmer" />)}</div>
      ) : (
        <div className="space-y-3">
          {banners.length === 0 && <div className="text-center py-12 text-white/25 text-sm">No banners yet</div>}
          {banners.map(b => {
            const img = b.desktop_image || b.image_url || '';
            return (
              <div key={b.id} className="glow-card overflow-hidden">
                <div className="flex items-stretch">
                  {/* Image preview */}
                  <div className="w-28 h-24 shrink-0 relative overflow-hidden bg-white/[0.02]">
                    {img ? (
                      <img src={img} alt={b.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center" style={{ background: `${b.color}08` }}>
                        <Image size={20} style={{ color: `${b.color}60` }} />
                      </div>
                    )}
                    <div className="absolute inset-0" style={{ background: `linear-gradient(to right, transparent, ${b.color}15)` }} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 px-4 py-3 flex flex-col justify-between min-w-0">
                    <div>
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <p className="text-sm font-bold truncate" style={{ color: b.color }}>{b.title}</p>
                        <StatusBadge banner={b} />
                        {b.priority > 0 && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-white/30">P{b.priority}</span>
                        )}
                      </div>
                      <p className="text-xs text-white/45 truncate">{b.subtitle}</p>
                      {(b.starts_at || b.ends_at) && (
                        <div className="flex items-center gap-1 mt-1">
                          <Calendar size={9} className="text-white/25" />
                          <span className="text-[9px] text-white/25">
                            {b.starts_at ? new Date(b.starts_at).toLocaleDateString() : '—'}
                            {' → '}
                            {b.ends_at ? new Date(b.ends_at).toLocaleDateString() : 'ongoing'}
                          </span>
                        </div>
                      )}
                      {b.button_text && (
                        <span className="inline-block mt-1 text-[9px] px-2 py-0.5 rounded-md font-medium" style={{ color: b.color, background: `${b.color}10`, border: `1px solid ${b.color}20` }}>
                          {b.button_text}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col items-center justify-center gap-1.5 px-3 border-l border-white/5 shrink-0">
                    <button onClick={() => handlePriority(b, 'up')} className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10" title="Increase priority">
                      <ArrowUp size={11} className="text-white/40" />
                    </button>
                    <button onClick={() => handlePriority(b, 'down')} className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10" title="Decrease priority">
                      <ArrowDown size={11} className="text-white/40" />
                    </button>
                    <button onClick={() => handleToggle(b)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-[9px] font-bold transition-colors"
                      style={b.is_active ? { color: '#22c55e', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' } : { color: 'rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      {b.is_active ? 'ON' : 'OFF'}
                    </button>
                    <button onClick={() => openEdit(b)} className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10">
                      <Edit2 size={11} className="text-white/50" />
                    </button>
                    <button onClick={() => setConfirmDelete(b)} className="w-7 h-7 rounded-lg bg-red-500/5 flex items-center justify-center hover:bg-red-500/10">
                      <Trash2 size={11} className="text-red-400/60" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-[9980] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="relative w-full max-w-lg rounded-3xl overflow-hidden" style={{ background: 'linear-gradient(145deg, #141820, #0D1117)', border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 24px 60px rgba(0,0,0,0.6)', maxHeight: '90vh', overflowY: 'auto' }}>
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4" style={{ background: 'linear-gradient(145deg, #141820, #0D1117)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="flex items-center gap-2">
                <Image size={16} className="text-mia-orange" />
                <h3 className="text-base font-bold text-white">{editing ? 'Edit Banner' : 'New Banner'}</h3>
              </div>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10">
                <X size={14} className="text-white/60" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Image Preview */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <button type="button" onClick={() => setPreviewTab('desktop')} className="text-xs px-3 py-1 rounded-lg font-medium transition-colors" style={previewTab === 'desktop' ? { color: '#FF8A00', background: 'rgba(255,138,0,0.1)', border: '1px solid rgba(255,138,0,0.25)' } : { color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    Desktop
                  </button>
                  <button type="button" onClick={() => setPreviewTab('mobile')} className="text-xs px-3 py-1 rounded-lg font-medium transition-colors" style={previewTab === 'mobile' ? { color: '#00D1FF', background: 'rgba(0,209,255,0.1)', border: '1px solid rgba(0,209,255,0.25)' } : { color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    Mobile
                  </button>
                </div>
                <div className="w-full h-32 rounded-2xl overflow-hidden flex items-center justify-center relative" style={{ background: previewImage ? 'transparent' : `${form.color}08`, border: `1px solid ${form.color}20` }}>
                  {previewImage ? (
                    <img src={previewImage} alt="Preview" className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-center">
                      <Image size={24} style={{ color: `${form.color}50` }} />
                      <span className="text-[10px] text-white/25">{previewTab === 'desktop' ? 'Desktop image preview' : 'Mobile image preview'}</span>
                    </div>
                  )}
                  {form.title && (
                    <div className="absolute inset-0 flex flex-col justify-center px-4 pointer-events-none" style={{ background: 'linear-gradient(to right, rgba(9,11,20,0.7), transparent)' }}>
                      <p className="text-sm font-bold" style={{ color: form.color, textShadow: `0 0 12px ${form.color}50` }}>{form.title}</p>
                      {form.subtitle && <p className="text-xs text-white/60 mt-0.5">{form.subtitle}</p>}
                    </div>
                  )}
                </div>
              </div>

              {/* Text fields */}
              <div className="grid grid-cols-1 gap-3">
                <input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Banner Title *" className="admin-input" />
                <input value={form.subtitle} onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))} placeholder="Subtitle" className="admin-input" />
              </div>

              {/* Images */}
              <div className="space-y-2">
                <p className="text-[11px] text-white/40 font-medium">Images</p>
                <input value={form.desktop_image} onChange={e => setForm(f => ({ ...f, desktop_image: e.target.value }))} placeholder="Desktop Image URL (1200×400 recommended)" className="admin-input" />
                <input value={form.mobile_image} onChange={e => setForm(f => ({ ...f, mobile_image: e.target.value }))} placeholder="Mobile Image URL (768×300 recommended)" className="admin-input" />
              </div>

              {/* Button */}
              <div className="grid grid-cols-2 gap-3">
                <input value={form.button_text} onChange={e => setForm(f => ({ ...f, button_text: e.target.value }))} placeholder="Button Text" className="admin-input" />
                <input value={form.button_link} onChange={e => setForm(f => ({ ...f, button_link: e.target.value }))} placeholder="Button Link URL" className="admin-input" />
              </div>

              {/* Priority */}
              <div>
                <p className="text-[11px] text-white/40 mb-1 font-medium">Priority (higher = shown first)</p>
                <input type="number" min="0" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: Number(e.target.value) }))} className="admin-input" />
              </div>

              {/* Schedule */}
              <div className="space-y-2">
                <p className="text-[11px] text-white/40 font-medium">Schedule (optional)</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] text-white/25 mb-1">Start Date & Time</p>
                    <input type="datetime-local" value={form.starts_at} onChange={e => setForm(f => ({ ...f, starts_at: e.target.value }))} className="admin-input" />
                  </div>
                  <div>
                    <p className="text-[10px] text-white/25 mb-1">End Date & Time</p>
                    <input type="datetime-local" value={form.ends_at} onChange={e => setForm(f => ({ ...f, ends_at: e.target.value }))} className="admin-input" />
                  </div>
                </div>
              </div>

              {/* Color */}
              <div>
                <p className="text-[11px] text-white/40 mb-2 font-medium">Accent Color</p>
                <div className="flex gap-2">
                  {COLORS.map(c => (
                    <button type="button" key={c} onClick={() => setForm(f => ({ ...f, color: c }))}
                      className="w-8 h-8 rounded-full transition-all"
                      style={{ background: c, boxShadow: form.color === c ? `0 0 12px ${c}80` : 'none', transform: form.color === c ? 'scale(1.2)' : 'scale(1)', border: form.color === c ? `2px solid white` : 'none' }} />
                  ))}
                </div>
              </div>

              {/* Active toggle */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} className="admin-checkbox" />
                <span className="text-xs text-white/60">Active (show on homepage)</span>
              </label>

              <button type="submit" disabled={saving} className="w-full py-3 rounded-2xl text-sm font-semibold text-white glow-btn disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #FF8A00, #FF2EC9)' }}>
                {saving ? 'Saving...' : editing ? 'Update Banner' : 'Create Banner'}
              </button>
            </form>
          </div>
        </div>
      )}

      {confirmDelete && (
        <ConfirmDialog
          title="Delete Banner"
          message={`Delete "${confirmDelete.title}"? This cannot be undone.`}
          confirmLabel="Delete"
          danger
          onConfirm={() => handleDelete(confirmDelete.id)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}
