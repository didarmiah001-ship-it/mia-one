import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Plus, Edit2, Trash2, X, Image, Calendar, ArrowUp, ArrowDown,
  Upload, CheckCircle, AlertTriangle, ExternalLink, Eye, EyeOff, LayoutGrid,
} from 'lucide-react';
import {
  adminFetchBanners, adminCreateBanner, adminUpdateBanner,
  adminDeleteBanner, adminUploadBannerImage,
  adminFetchPromoBanners, adminCreatePromoBanner, adminUpdatePromoBanner, adminDeletePromoBanner
} from '../lib/api';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useToast } from '../components/Toast';

// ── Types ─────────────────────────────────────────────────────────────────────

type BannerStatus = 'active' | 'draft' | 'scheduled';

interface FormState {
  title: string;
  subtitle: string;
  color: string;
  desktop_image: string;
  mobile_image: string;
  button_text: string;
  button_link: string;
  open_in_new_tab: boolean;
  status: BannerStatus;
  priority: number;
  starts_at: string;
  ends_at: string;
}

interface UploadState {
  uploading: boolean;
  warning: string | null;
  done: boolean;
}

const EMPTY: FormState = {
  title: '',
  subtitle: '',
  color: '#FF8A00',
  desktop_image: '',
  mobile_image: '',
  button_text: 'Shop Now',
  button_link: '',
  open_in_new_tab: false,
  status: 'active',
  priority: 0,
  starts_at: '',
  ends_at: '',
};

const COLORS = ['#FF8A00', '#FF2EC9', '#7B2CFF', '#00D1FF', '#22c55e', '#f59e0b', '#ef4444', '#ffffff'];

const selectDarkStyles = "w-full px-3.5 py-2.5 rounded-xl text-sm bg-[#1A202C]/60 border border-white/10 text-white focus:outline-none focus:border-mia-orange/40 transition-colors";

// ── Helpers ───────────────────────────────────────────────────────────────────

function derivedStatus(b: any): BannerStatus {
  if (!b.is_active) return 'draft';
  if (b.starts_at && new Date(b.starts_at) > new Date()) return 'scheduled';
  return 'active';
}

function getImageDimensions(file: File): Promise<{ w: number; h: number }> {
  return new Promise(resolve => {
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve({ w: img.naturalWidth, h: img.naturalHeight }); };
    img.onerror = () => { URL.revokeObjectURL(url); resolve({ w: 0, h: 0 }); };
    img.src = url;
  });
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function Field({ label, required, hint, children }: {
  label: string; required?: boolean; hint?: string; children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-semibold text-white/45 uppercase tracking-wider">
          {label}{required && <span className="text-red-400 ml-0.5">*</span>}
        </label>
        {hint && <span className="text-[10px] text-white/20">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function Divider({ label }: { label: string }) {
  return (
    <div className="relative flex items-center gap-3 py-1">
      <div className="h-px flex-1 bg-white/[0.05]" />
      <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest shrink-0">{label}</span>
      <div className="h-px flex-1 bg-white/[0.05]" />
    </div>
  );
}

function StatusBadge({ banner }: { banner: any }) {
  const now = Date.now();
  const start = banner.starts_at ? new Date(banner.starts_at).getTime() : null;
  const end   = banner.ends_at   ? new Date(banner.ends_at).getTime()   : null;

  if (!banner.is_active)
    return <span className="text-[10px] px-2 py-0.5 rounded-lg text-white/30 bg-white/5 border border-white/[0.08]">Draft</span>;
  if (end && end < now)
    return <span className="text-[10px] px-2 py-0.5 rounded-lg text-red-400 bg-red-500/10 border border-red-500/20">Expired</span>;
  if (start && start > now)
    return <span className="text-[10px] px-2 py-0.5 rounded-lg text-blue-400 bg-blue-500/10 border border-blue-500/20">Scheduled</span>;
  return <span className="text-[10px] px-2 py-0.5 rounded-lg text-green-400 bg-green-500/10 border border-green-500/20">Live</span>;
}

// ── ImageUploadField ───────────────────────────────────────────────────────────

function ImageUploadField({
  label, hint, value, onChange, slot,
}: {
  label: string; hint: string; value: string;
  onChange: (url: string) => void;
  slot: 'desktop' | 'mobile';
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [upload, setUpload] = useState<UploadState>({ uploading: false, warning: null, done: false });
  const recW = slot === 'desktop' ? 1200 : 768;
  const recH = slot === 'desktop' ? 400  : 300;

  const handleFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    onChange(objectUrl);
    setUpload({ uploading: true, warning: null, done: false });

    const { w, h } = await getImageDimensions(file);
    let warning: string | null = null;
    if (w > 0 && h > 0 && (w !== recW || h !== recH)) {
      warning = `Recommended ${recW}×${recH} px. Your image is ${w}×${h} px.`;
    }

    const { url, error } = await adminUploadBannerImage(file, slot);
    if (error || !url) {
      setUpload({ uploading: false, warning: error || 'Upload failed', done: false });
      URL.revokeObjectURL(objectUrl);
      onChange('');
    } else {
      URL.revokeObjectURL(objectUrl);
      onChange(url);
      setUpload({ uploading: false, warning, done: true });
    }
    if (inputRef.current) inputRef.current.value = '';
  }, [onChange, slot, recW, recH]);

  return (
    <Field label={label} hint={hint}>
      <div className="flex gap-2">
        <input
          value={value}
          onChange={e => { onChange(e.target.value); setUpload({ uploading: false, warning: null, done: false }); }}
          placeholder={`https://… or click Upload`}
          className="admin-input flex-1 min-w-0"
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={upload.uploading}
          className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
          style={{
            background: upload.done ? 'rgba(34,197,94,0.12)' : 'rgba(255,138,0,0.1)',
            border: upload.done ? '1px solid rgba(34,197,94,0.25)' : '1px solid rgba(255,138,0,0.25)',
            color: upload.done ? '#22c55e' : '#FF8A00',
          }}
        >
          {upload.uploading ? (
            <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : upload.done ? (
            <CheckCircle size={13} />
          ) : (
            <Upload size={13} />
          )}
          {upload.uploading ? 'Uploading…' : upload.done ? 'Done' : 'Upload'}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleFile}
          className="hidden"
        />
      </div>
      {upload.warning && (
        <div className="flex items-start gap-1.5 mt-1">
          <AlertTriangle size={11} className="text-yellow-400 shrink-0 mt-0.5" />
          <p className="text-[10px] text-yellow-400/80">{upload.warning}</p>
        </div>
      )}
    </Field>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export function AdminBanners() {
  const toast = useToast();
  const [banners, setBanners]       = useState<any[]>([]);
  const [promoBanners, setPromoBanners] = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  
  const [showForm, setShowForm]     = useState(false);
  const [modalMode, setModalMode]   = useState<'hero' | 'promo'>('hero');
  const [editing, setEditing]       = useState<any>(null);
  const [form, setForm]             = useState<FormState>(EMPTY);
  const [saving, setSaving]         = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<any>(null);
  const [deleteMode, setDeleteMode] = useState<'hero' | 'promo'>('hero');
  const [previewTab, setPreviewTab] = useState<'desktop' | 'mobile'>('desktop');
  const [showPreview, setShowPreview] = useState(true);

  const set = useCallback(<K extends keyof FormState>(key: K, val: FormState[K]) => {
    setForm(f => ({ ...f, [key]: val }));
  }, []);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { 
      const [b, pb] = await Promise.all([adminFetchBanners(), adminFetchPromoBanners()]); 
      setBanners(b);
      setPromoBanners(pb);
    }
    catch (e: any) { setError(e.message || 'Failed to load banners'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = (mode: 'hero' | 'promo') => {
    setModalMode(mode);
    setEditing(null);
    setForm(EMPTY);
    setPreviewTab('desktop');
    setShowPreview(true);
    setShowForm(true);
  };

  const openEdit = (b: any, mode: 'hero' | 'promo') => {
    setModalMode(mode);
    setEditing(b);
    setForm({
      title:          b.title ?? '',
      subtitle:       b.subtitle ?? '',
      color:          b.color ?? '#FF8A00',
      desktop_image:  b.desktop_image ?? b.image_url ?? '',
      mobile_image:   b.mobile_image ?? '',
      button_text:    b.button_text ?? 'Shop Now',
      button_link:    b.button_link ?? b.link_url ?? '',
      open_in_new_tab: b.open_in_new_tab ?? false,
      status:         derivedStatus(b),
      priority:       b.priority ?? 0,
      starts_at:      b.starts_at ? b.starts_at.slice(0, 16) : '',
      ends_at:        b.ends_at   ? b.ends_at.slice(0, 16)   : '',
    });
    setPreviewTab('desktop');
    setShowPreview(true);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const payload = {
      title:          form.title,
      subtitle:       form.subtitle,
      color:          form.color,
      desktop_image:  form.desktop_image,
      mobile_image:   form.mobile_image,
      image_url:      form.desktop_image,
      button_text:    form.button_text,
      button_link:    form.button_link,
      link_url:       form.button_link,
      open_in_new_tab: form.open_in_new_tab,
      is_active:      form.status !== 'draft',
      priority:       form.priority,
      sort_order:     form.priority,
      starts_at:      form.starts_at || null,
      ends_at:        form.ends_at   || null,
    };

    if (modalMode === 'hero') {
      if (editing) {
        const { error } = await adminUpdateBanner(editing.id, payload);
        if (error) toast.error(error);
        else {
          setBanners(bs => bs.map(b => b.id === editing.id ? { ...b, ...payload } : b));
          toast.success('Hero banner updated');
          setShowForm(false);
          await load();
        }
      } else {
        const { error } = await adminCreateBanner(payload);
        if (error) toast.error(error);
        else {
          toast.success('Hero banner created');
          setShowForm(false);
          await load();
        }
      }
    } else {
      if (editing) {
        const { error } = await adminUpdatePromoBanner(editing.id, payload);
        if (error) toast.error(error);
        else {
          setPromoBanners(pbs => pbs.map(b => b.id === editing.id ? { ...b, ...payload } : b));
          toast.success('Promo banner updated');
          setShowForm(false);
          await load();
        }
      } else {
        const { error } = await adminCreatePromoBanner(payload);
        if (error) toast.error(error);
        else {
          toast.success('Promo banner created');
          setShowForm(false);
          await load();
        }
      }
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    if (deleteMode === 'hero') {
      const { error } = await adminDeleteBanner(confirmDelete.id);
      if (error) toast.error(error);
      else { setBanners(bs => bs.filter(b => b.id !== confirmDelete.id)); toast.success('Hero banner deleted'); }
    } else {
      const { error } = await adminDeletePromoBanner(confirmDelete.id);
      if (error) toast.error(error);
      else { setPromoBanners(pbs => pbs.filter(b => b.id !== confirmDelete.id)); toast.success('Promo banner deleted'); }
    }
    setConfirmDelete(null);
  };

  const handleToggle = async (b: any, mode: 'hero' | 'promo') => {
    const newActive = !b.is_active;
    if (mode === 'hero') {
      await adminUpdateBanner(b.id, { is_active: newActive });
      setBanners(bs => bs.map(x => x.id === b.id ? { ...x, is_active: newActive } : x));
    } else {
      await adminUpdatePromoBanner(b.id, { is_active: newActive });
      setPromoBanners(pbs => pbs.map(x => x.id === b.id ? { ...x, is_active: newActive } : x));
    }
    toast.success(newActive ? 'Banner enabled' : 'Banner disabled');
  };

  const handlePriority = async (b: any, dir: 'up' | 'down', mode: 'hero' | 'promo') => {
    const p = dir === 'up' ? b.priority + 1 : Math.max(0, b.priority - 1);
    if (mode === 'hero') {
      await adminUpdateBanner(b.id, { priority: p });
      setBanners(bs => bs.map(x => x.id === b.id ? { ...x, priority: p } : x));
    } else {
      await adminUpdatePromoBanner(b.id, { priority: p });
      setPromoBanners(pbs => pbs.map(x => x.id === b.id ? { ...x, priority: p } : x));
    }
  };

  const previewImage = previewTab === 'desktop' ? form.desktop_image : form.mobile_image;

  return (
    <div className="space-y-8">
      {/* ── SECTION 1: HERO BANNERS ──────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <LayoutGrid size={16} className="text-mia-orange" />
            Hero Banners <span className="text-white/30 text-sm font-normal">({banners.length})</span>
          </h2>
          <button
            onClick={() => openCreate('hero')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white glow-btn"
            style={{ background: 'linear-gradient(135deg, #FF8A00, #FF2EC9)' }}
          >
            <Plus size={14} /> Add Banner
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, i) => <div key={i} className="glow-card h-28 shimmer" />)}
          </div>
        ) : (
          <div className="space-y-3">
            {banners.length === 0 && (
              <div className="text-center py-10 bg-white/[0.01] rounded-2xl border border-white/5 text-white/20 text-sm">
                No hero banners found.
              </div>
            )}
            {banners.map(b => {
              const img = b.desktop_image || b.image_url || '';
              return (
                <div key={b.id} className="glow-card overflow-hidden">
                  <div className="flex items-stretch">
                    <div className="w-28 h-24 shrink-0 relative overflow-hidden bg-white/[0.02]">
                      {img ? <img src={img} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Image size={20} className="text-white/10" /></div>}
                    </div>
                    <div className="flex-1 px-4 py-3 flex flex-col justify-between min-w-0">
                      <div>
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <p className="text-sm font-bold truncate" style={{ color: b.color }}>{b.title}</p>
                          <StatusBadge banner={b} />
                          {b.priority > 0 && <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-white/30">P{b.priority}</span>}
                        </div>
                        <p className="text-xs text-white/75 truncate">{b.subtitle}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-center justify-center gap-1.5 px-3 border-l border-white/5 shrink-0">
                      <button onClick={() => handlePriority(b, 'up', 'hero')} className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10"><ArrowUp size={11} className="text-white/40" /></button>
                      <button onClick={() => handleToggle(b, 'hero')} className="w-7 h-7 rounded-lg text-[9px] font-bold" style={b.is_active ? { color: '#22c55e', background: 'rgba(34,197,94,0.08)' } : { color: 'rgba(255,255,255,0.2)' }}>{b.is_active ? 'ON' : 'OFF'}</button>
                      <button onClick={() => openEdit(b, 'hero')} className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center"><Edit2 size={11} className="text-white/50" /></button>
                      <button onClick={() => { setConfirmDelete(b); setDeleteMode('hero'); }} className="w-7 h-7 rounded-lg bg-red-500/5 flex items-center justify-center"><Trash2 size={11} className="text-red-400/60" /></button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── SECTION 2: BOTTOM PROMO BANNERS ───────────────────────── */}
      <div className="space-y-4 pt-4 border-t border-white/5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <LayoutGrid size={16} className="text-[#00D1FF]" />
              Bottom Promo Banners <span className="text-white/30 text-sm font-normal">({promoBanners.length})</span>
            </h2>
            <p className="text-[11px] text-white/30 mt-0.5">Middle section dynamic slidable promo banners grid</p>
          </div>
          <button
            onClick={() => openCreate('promo')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white glow-btn"
            style={{ background: 'linear-gradient(135deg, #00D1FF, #7B2CFF)' }}
          >
            <Plus size={14} /> Add Promo Banner
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 1 }).map((_, i) => <div key={i} className="glow-card h-28 shimmer" />)}
          </div>
        ) : (
          <div className="space-y-3">
            {promoBanners.length === 0 && (
              <div className="text-center py-12 bg-white/[0.01] rounded-2xl border border-white/5 text-white/20 text-sm">
                No bottom promo banners configured. Admin text fallback will show on user site.
              </div>
            )}
            {promoBanners.map(b => {
              const img = b.desktop_image || b.image_url || '';
              return (
                <div key={b.id} className="glow-card overflow-hidden border border-[#00D1FF]/10">
                  <div className="flex items-stretch">
                    <div className="w-28 h-24 shrink-0 relative overflow-hidden bg-white/[0.02]">
                      {img ? <img src={img} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Image size={20} className="text-white/10" /></div>}
                    </div>
                    <div className="flex-1 px-4 py-3 flex flex-col justify-between min-w-0">
                      <div>
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <p className="text-sm font-bold truncate" style={{ color: b.color || '#00D1FF' }}>{b.title}</p>
                          <StatusBadge banner={b} />
                          {b.priority > 0 && <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400">P{b.priority}</span>}
                        </div>
                        <p className="text-xs text-white/75 truncate">{b.subtitle}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-center justify-center gap-1.5 px-3 border-l border-white/5 shrink-0">
                      <button onClick={() => handlePriority(b, 'up', 'promo')} className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center"><ArrowUp size={11} className="text-white/40" /></button>
                      <button onClick={() => handleToggle(b, 'promo')} className="w-7 h-7 rounded-lg text-[9px] font-bold" style={b.is_active ? { color: '#00D1FF', background: 'rgba(0,209,255,0.08)' } : { color: 'rgba(255,255,255,0.2)' }}>{b.is_active ? 'ON' : 'OFF'}</button>
                      <button onClick={() => openEdit(b, 'promo')} className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center"><Edit2 size={11} className="text-white/50" /></button>
                      <button onClick={() => { setConfirmDelete(b); setDeleteMode('promo'); }} className="w-7 h-7 rounded-lg bg-red-500/5 flex items-center justify-center"><Trash2 size={11} className="text-red-400/60" /></button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Create / Edit Modal ──────────────────────────────── */}
      {showForm && (
        <div className="fixed inset-0 z-[9980] flex items-start justify-center p-4 overflow-y-auto">
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setShowForm(false)} />

          <div className="relative w-full max-w-lg my-8 rounded-2xl overflow-hidden"
            style={{ background: '#13131A', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 32px 80px rgba(0,0,0,0.7)' }}>

            {/* Modal Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4"
              style={{ background: '#13131A', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: modalMode === 'hero' ? 'rgba(255,138,0,0.12)' : 'rgba(0,209,255,0.12)', border: `1px solid ${modalMode === 'hero' ? 'rgba(255,138,0,0.2)' : 'rgba(0,209,255,0.2)'}` }}>
                  <Image size={15} className={modalMode === 'hero' ? 'text-[#FF8A00]' : 'text-[#00D1FF]'} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white leading-tight">
                    {editing ? 'Edit' : 'New'} {modalMode === 'hero' ? 'Hero Banner' : 'Bottom Promo Banner'}
                  </h3>
                  <p className="text-[10px] text-white/30">{modalMode === 'hero' ? 'Homepage hero carousel element' : 'Bottom side list view promo banner'}</p>
                </div>
              </div>
              <button onClick={() => setShowForm(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all">
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Preview */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <button type="button" onClick={() => setShowPreview(v => !v)}
                    className="text-[10px] text-white/25 hover:text-white/50 flex items-center gap-1 transition-colors">
                    {showPreview ? <EyeOff size={11} /> : <Eye size={11} />}
                    {showPreview ? 'Hide' : 'Show'} preview
                  </button>
                  <div className="flex gap-1.5 ml-auto">
                    {(['desktop', 'mobile'] as const).map(tab => (
                      <button key={tab} type="button" onClick={() => setPreviewTab(tab)}
                        className="text-[11px] px-2.5 py-1 rounded-lg font-semibold transition-colors capitalize"
                        style={previewTab === tab
                          ? { color: modalMode === 'hero' ? '#FF8A00' : '#00D1FF', background: modalMode === 'hero' ? 'rgba(255,138,0,0.1)' : 'rgba(0,209,255,0.1)', border: `1px solid ${modalMode === 'hero' ? 'rgba(255,138,0,0.25)' : 'rgba(0,209,255,0.25)'}` }
                          : { color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                        {tab}
                      </button>
                    ))}
                  </div>
                </div>

                {showPreview && (
                  <div className="w-full rounded-xl overflow-hidden relative flex items-center justify-center transition-all"
                    style={{ height: previewTab === 'mobile' ? 96 : 124, background: previewImage ? 'transparent' : `${form.color}08`, border: `1px solid ${form.color}22` }}>
                    {previewImage ? (
                      <img src={previewImage} alt="Preview" className="w-full h-full object-cover"
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <Image size={22} style={{ color: `${form.color}50` }} />
                        <span className="text-[10px] text-white/15">Image preview</span>
                      </div>
                    )}
                    {form.title && (
                      <div className="absolute inset-0 flex flex-col justify-center px-4 pointer-events-none"
                        style={{ background: 'linear-gradient(to right, rgba(9,11,20,0.75) 0%, transparent 60%)' }}>
                        <p className="text-sm font-bold drop-shadow" style={{ color: form.color }}>{form.title}</p>
                        {form.subtitle && <p className="text-xs text-white/90 mt-0.5">{form.subtitle}</p>}
                        {form.button_text && (
                          <span className="inline-block mt-2 text-[9px] px-2 py-0.5 rounded font-semibold w-fit"
                            style={{ background: form.color, color: '#0A0A0F' }}>
                            {form.button_text}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <Divider label="Content" />

              {/* Title + Subtitle */}
              <Field label="Banner Title" required>
                <input required value={form.title}
                  onChange={e => set('title', e.target.value)}
                  placeholder="e.g. Summer Sale — Up to 50% Off"
                  className="admin-input" />
              </Field>
              <Field label="Subtitle">
                <input value={form.subtitle}
                  onChange={e => set('subtitle', e.target.value)}
                  placeholder="e.g. Free shipping on all orders above ৳999"
                  className="admin-input" />
              </Field>

              <Divider label="Images" />

              <ImageUploadField
                label="Desktop Image"
                hint="Recommended 1200×400 px"
                value={form.desktop_image}
                onChange={url => set('desktop_image', url)}
                slot="desktop"
              />

              <ImageUploadField
                label="Mobile Image"
                hint="Recommended 768×300 px"
                value={form.mobile_image}
                onChange={url => set('mobile_image', url)}
                slot="mobile"
              />

              <Divider label="Call to Action" />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Button Text">
                  <input value={form.button_text}
                    onChange={e => set('button_text', e.target.value)}
                    placeholder="Shop Now"
                    className="admin-input" />
                </Field>
                <Field label="Button Link">
                  <input value={form.button_link}
                    onChange={e => set('button_link', e.target.value)}
                    placeholder="/categories or https://…"
                    className="admin-input" />
                </Field>
              </div>

              <label className="flex items-center gap-3 cursor-pointer py-0.5">
                <input type="checkbox" checked={form.open_in_new_tab}
                  onChange={e => set('open_in_new_tab', e.target.checked)}
                  className="admin-checkbox" />
                <div>
                  <p className="text-sm text-white/80 font-medium flex items-center gap-1.5">
                    <ExternalLink size={12} className="text-white/30" />
                    Open in New Tab
                  </p>
                  <p className="text-[11px] text-white/25">Opens button link in a new browser tab</p>
                </div>
              </label>

              <Divider label="Status & Schedule" />

              <Field label="Banner Status">
                <div className="grid grid-cols-3 gap-2">
                  {(['active', 'draft', 'scheduled'] as BannerStatus[]).map(s => {
                    const styles: Record<BannerStatus, { active: string; inactive: string }> = {
                      active:    { active: 'text-green-400 bg-green-500/12 border-green-500/30', inactive: 'text-white/35 bg-white/[0.03] border-white/[0.07]' },
                      draft:     { active: 'text-white/60 bg-white/8 border-white/20',           inactive: 'text-white/35 bg-white/[0.03] border-white/[0.07]' },
                      scheduled: { active: 'text-blue-400 bg-blue-500/12 border-blue-500/30',    inactive: 'text-white/35 bg-white/[0.03] border-white/[0.07]' },
                    };
                    return (
                      <button key={s} type="button" onClick={() => set('status', s)}
                        className={`py-2 rounded-xl text-xs font-semibold capitalize border transition-all ${form.status === s ? styles[s].active : styles[s].inactive}`}>
                        {s}
                      </button>
                    );
                  })}
                </div>
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Start Date & Time">
                  <input type="datetime-local" value={form.starts_at}
                    onChange={e => set('starts_at', e.target.value)}
                    required={form.status === 'scheduled'}
                    className="admin-input" />
                </Field>
                <Field label="End Date & Time">
                  <input type="datetime-local" value={form.ends_at}
                    onChange={e => set('ends_at', e.target.value)}
                    className="admin-input" />
                </Field>
              </div>

              <Divider label="Appearance" />

              <Field label="Display Priority" hint="Higher = shown first in list">
                <input type="number" min="0" value={form.priority}
                  onChange={e => set('priority', Number(e.target.value))}
                  className="admin-input" style={{ maxWidth: 100 }} />
              </Field>

              <Field label="Accent Color">
                <div className="flex items-center gap-2.5 flex-wrap">
                  {COLORS.map(c => (
                    <button key={c} type="button" onClick={() => set('color', c)}
                      className="w-7 h-7 rounded-full transition-all duration-200 shrink-0"
                      style={{
                        background: c === '#ffffff' ? 'rgba(255,255,255,0.85)' : c,
                        transform: form.color === c ? 'scale(1.3)' : 'scale(1)',
                        boxShadow: form.color === c ? `0 0 10px ${c}90` : 'none',
                        outline: form.color === c ? '2px solid white' : 'none',
                        outlineOffset: 2,
                      }} />
                  ))}
                  <span className="text-[10px] text-white/20 font-mono ml-1">{form.color}</span>
                </div>
              </Field>

              <div className="pt-2">
                <button type="submit" disabled={saving}
                  className="w-full py-3 rounded-xl text-sm font-bold text-white glow-btn disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: modalMode === 'hero' ? 'linear-gradient(135deg, #FF8A00, #FF2EC9)' : 'linear-gradient(135deg, #00D1FF, #7B2CFF)' }}>
                  {saving ? 'Saving…' : editing ? 'Update Banner' : 'Create Banner'}
                </button>
              </div>
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
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}
