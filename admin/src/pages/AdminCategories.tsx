import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Tag } from 'lucide-react';
import { fetchCategories, adminCreateCategory, adminUpdateCategory, adminDeleteCategory } from '../lib/api';
import { CategoryIcon } from '../components/CategoryIcon';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useToast } from '../components/Toast';

const ICONS = ['ShoppingBasket', 'Droplets', 'Coffee', 'Cookie', 'Home', 'Smartphone', 'Shirt', 'Sparkles', 'Package', 'Heart', 'Zap', 'Star'];
const COLORS = ['#FF8A00', '#00D1FF', '#FF2EC9', '#7B2CFF', '#22c55e', '#f59e0b'];
const EMPTY = { name: '', icon: 'Package', color: '#FF8A00' };

export function AdminCategories() {
  const toast = useToast();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<any>(null);

  const load = async () => { const c = await fetchCategories(); setCategories(c); setLoading(false); };
  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm(EMPTY); setShowForm(true); };
  const openEdit = (c: any) => { setEditing(c); setForm({ name: c.name, icon: c.icon, color: c.color }); setShowForm(true); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    if (editing) {
      const { error } = await adminUpdateCategory(editing.id, form);
      if (error) toast.error(error); else { toast.success('Category updated'); setShowForm(false); await load(); }
    } else {
      const { error } = await adminCreateCategory(form);
      if (error) toast.error(error); else { toast.success('Category created'); setShowForm(false); await load(); }
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await adminDeleteCategory(id);
    if (error) toast.error(error); else { toast.success('Category deleted'); await load(); }
    setConfirmDelete(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-white">Categories <span className="text-white/30 text-sm font-normal">({categories.length})</span></h2>
        <button onClick={openCreate} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white glow-btn" style={{ background: 'linear-gradient(135deg, #FF8A00, #FF2EC9)' }}>
          <Plus size={14} /> Add Category
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="glow-card h-28 shimmer" />)}</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {categories.map(cat => (
            <div key={cat.id} className="glow-card p-4 relative group">
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openEdit(cat)} className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/15 transition-colors"><Edit2 size={11} className="text-white/50" /></button>
                <button onClick={() => setConfirmDelete(cat)} className="w-7 h-7 rounded-lg bg-red-500/5 flex items-center justify-center hover:bg-red-500/15 transition-colors"><Trash2 size={11} className="text-red-400/60" /></button>
              </div>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3" style={{ background: `${cat.color}12`, border: `1px solid ${cat.color}20` }}>
                <CategoryIcon name={cat.icon} size={22} style={{ color: cat.color }} />
              </div>
              <p className="text-sm font-semibold text-white/90">{cat.name}</p>
              <div className="w-3 h-3 rounded-full mt-2" style={{ background: cat.color }} />
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-[9980] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="relative w-full max-w-sm rounded-3xl p-6" style={{ background: 'linear-gradient(145deg, #141820, #0D1117)', border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 24px 60px rgba(0,0,0,0.5)' }}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2"><Tag size={16} className="text-mia-orange" /><h3 className="text-base font-bold text-white">{editing ? 'Edit Category' : 'New Category'}</h3></div>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10"><X size={14} className="text-white/60" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Category Name" className="admin-input" />
              <div>
                <p className="text-xs text-white/40 mb-2 font-medium">Icon</p>
                <div className="grid grid-cols-6 gap-2">
                  {ICONS.map(icon => (
                    <button type="button" key={icon} onClick={() => setForm(f => ({ ...f, icon }))}
                      className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
                      style={{ background: form.icon === icon ? `${form.color}15` : 'rgba(255,255,255,0.03)', border: `1px solid ${form.icon === icon ? form.color + '40' : 'rgba(255,255,255,0.06)'}` }}>
                      <CategoryIcon name={icon} size={16} style={{ color: form.icon === icon ? form.color : 'rgba(255,255,255,0.4)' }} />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-white/40 mb-2 font-medium">Color</p>
                <div className="flex gap-2">
                  {COLORS.map(c => (
                    <button type="button" key={c} onClick={() => setForm(f => ({ ...f, color: c }))}
                      className="w-8 h-8 rounded-full transition-all"
                      style={{ background: c, boxShadow: form.color === c ? `0 0 12px ${c}80` : 'none', transform: form.color === c ? 'scale(1.2)' : 'scale(1)' }} />
                  ))}
                </div>
              </div>
              <button type="submit" disabled={saving} className="w-full py-3 rounded-2xl text-sm font-semibold text-white glow-btn disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #FF8A00, #FF2EC9)' }}>
                {saving ? 'Saving...' : editing ? 'Update' : 'Create Category'}
              </button>
            </form>
          </div>
        </div>
      )}
      {confirmDelete && <ConfirmDialog title="Delete Category" message={`Delete "${confirmDelete.name}"? This cannot be undone.`} confirmLabel="Delete" danger onConfirm={() => handleDelete(confirmDelete.id)} onCancel={() => setConfirmDelete(null)} />}
    </div>
  );
}
