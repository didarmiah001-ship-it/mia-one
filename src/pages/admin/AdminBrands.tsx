import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Tag } from 'lucide-react';
import { adminFetchBrands, adminCreateBrand, adminUpdateBrand, adminDeleteBrand } from '../../lib/api';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { useToast } from '../../components/Toast';

const EMPTY = { name: '', logo_url: '' };

export function AdminBrands() {
  const toast = useToast();
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<any>(null);

  const load = async () => { const b = await adminFetchBrands(); setBrands(b); setLoading(false); };
  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm(EMPTY); setShowForm(true); };
  const openEdit = (b: any) => { setEditing(b); setForm({ name: b.name, logo_url: b.logo_url || '' }); setShowForm(true); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    if (editing) {
      const { error } = await adminUpdateBrand(editing.id, form);
      if (error) toast.error(error); else { toast.success('Brand updated'); setShowForm(false); await load(); }
    } else {
      const { error } = await adminCreateBrand(form);
      if (error) toast.error(error); else { toast.success('Brand created'); setShowForm(false); await load(); }
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await adminDeleteBrand(id);
    if (error) toast.error(error); else { toast.success('Brand removed'); await load(); }
    setConfirmDelete(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-white">Brands <span className="text-white/30 text-sm font-normal">({brands.length})</span></h2>
        <button onClick={openCreate} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white glow-btn" style={{ background: 'linear-gradient(135deg, #FF8A00, #FF2EC9)' }}>
          <Plus size={14} /> Add Brand
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="glow-card h-20 shimmer" />)}</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {brands.length === 0 && <div className="col-span-full text-center py-12 text-white/25 text-sm">No brands yet</div>}
          {brands.map(b => (
            <div key={b.id} className="glow-card p-4 relative group">
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openEdit(b)} className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/15"><Edit2 size={11} className="text-white/50" /></button>
                <button onClick={() => setConfirmDelete(b)} className="w-7 h-7 rounded-lg bg-red-500/5 flex items-center justify-center hover:bg-red-500/15"><Trash2 size={11} className="text-red-400/60" /></button>
              </div>
              {b.logo_url ? (
                <img src={b.logo_url} alt={b.name} className="w-12 h-12 object-contain rounded-xl mb-3 bg-white/5" onError={e => (e.target as any).style.display = 'none'} />
              ) : (
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3" style={{ background: 'rgba(255,138,0,0.08)', border: '1px solid rgba(255,138,0,0.15)' }}>
                  <Tag size={20} className="text-mia-orange/50" />
                </div>
              )}
              <p className="text-sm font-semibold text-white/90 truncate">{b.name}</p>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-[9980] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="relative w-full max-w-sm rounded-3xl p-6" style={{ background: 'linear-gradient(145deg, #141820, #0D1117)', border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 24px 60px rgba(0,0,0,0.5)' }}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2"><Tag size={16} className="text-mia-orange" /><h3 className="text-base font-bold text-white">{editing ? 'Edit Brand' : 'New Brand'}</h3></div>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10"><X size={14} className="text-white/60" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Brand Name" className="admin-input" />
              <input value={form.logo_url} onChange={e => setForm(f => ({ ...f, logo_url: e.target.value }))} placeholder="Logo URL (optional)" className="admin-input" />
              <button type="submit" disabled={saving} className="w-full py-3 rounded-2xl text-sm font-semibold text-white glow-btn disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #FF8A00, #FF2EC9)' }}>
                {saving ? 'Saving...' : editing ? 'Update' : 'Create Brand'}
              </button>
            </form>
          </div>
        </div>
      )}
      {confirmDelete && <ConfirmDialog title="Remove Brand" message={`Remove "${confirmDelete.name}"?`} confirmLabel="Remove" danger onConfirm={() => handleDelete(confirmDelete.id)} onCancel={() => setConfirmDelete(null)} />}
    </div>
  );
}
