import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, Package, Eye, EyeOff } from 'lucide-react';
import { adminFetchAllProducts, adminDeleteProduct, adminUpdateProduct, fetchCategories, adminFetchBrands } from '../lib/api';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useToast } from '../components/Toast';
import { ProductForm } from './ProductForm';

const FLAG_STYLES: Record<string, { color: string; label: string }> = {
  is_featured:    { color: '#FF8A00', label: 'Featured' },
  is_best_selling:{ color: '#FF2EC9', label: 'Best Selling' },
  is_trending:    { color: '#7B2CFF', label: 'Trending' },
  is_new:         { color: '#00D1FF', label: 'New' },
};

type SortKey = 'name' | 'price' | 'stock' | 'created_at';

// Custom dropdown select dark styling constant
const selectDarkStyles = "px-3 py-2 text-xs bg-[#1A202C]/60 border border-white/10 rounded-xl text-white/80 focus:outline-none focus:border-mia-orange/40 transition-colors cursor-pointer appearance-none pr-8";

export function AdminProducts() {
  const toast = useToast();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortKey, setSortKey] = useState<SortKey>('created_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [confirmDelete, setConfirmDelete] = useState<any>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [p, c, b] = await Promise.all([adminFetchAllProducts(), fetchCategories(), adminFetchBrands()]);
      setProducts(p);
      setCategories(c);
      setBrands(b);
    } catch (e: any) {
      setError(e.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: string) => {
    const { error } = await adminDeleteProduct(id);
    if (error) { toast.error(error); } else { toast.success('Product removed'); await load(); }
    setConfirmDelete(null);
  };

  const handleToggleActive = async (p: any) => {
    await adminUpdateProduct(p.id, { is_active: !p.is_active });
    toast.success(p.is_active ? 'Product hidden' : 'Product activated');
    await load();
  };

  const openCreate = () => { setEditing(null); setShowForm(true); };
  const openEdit = (p: any) => { setEditing(p); setShowForm(true); };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const filtered = products
    .filter(p => {
      if (search && !p.name.toLowerCase().includes(search.toLowerCase()) &&
          !(p.sku || '').toLowerCase().includes(search.toLowerCase())) return false;
      if (filterCategory && p.category_id !== filterCategory) return false;
      if (filterStatus === 'active' && !p.is_active) return false;
      if (filterStatus === 'inactive' && p.is_active) return false;
      if (filterStatus === 'low_stock' && p.stock >= 5) return false;
      return true;
    })
    .sort((a, b) => {
      let av = a[sortKey], bv = b[sortKey];
      if (typeof av === 'string') av = av.toLowerCase();
      if (typeof bv === 'string') bv = bv.toLowerCase();
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

  const SortBtn = ({ k, label }: { k: SortKey; label: string }) => (
    <button onClick={() => toggleSort(k)} className="flex items-center gap-1 text-[11px] font-semibold transition-colors"
      style={{ color: sortKey === k ? '#FF8A00' : 'rgba(255,255,255,0.3)' }}>
      {label}
      <span className="text-[9px]">{sortKey === k ? (sortDir === 'asc' ? '↑' : '↓') : ''}</span>
    </button>
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-between">
        <h2 className="text-base font-bold text-white">
          Products <span className="text-white/30 text-sm font-normal">({filtered.length})</span>
        </h2>
        <button onClick={openCreate}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white glow-btn"
          style={{ background: 'linear-gradient(135deg, #FF8A00, #FF2EC9)' }}>
          <Plus size={14} /> Add Product
        </button>
      </div>

      {/* Filters with Dark Option Overrides */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name or SKU..."
            className="w-full pl-8 pr-3 py-2 text-xs bg-white/[0.03] border border-white/8 rounded-xl text-white placeholder:text-white/25 focus:outline-none focus:border-mia-orange/40" />
        </div>
        
        <div className="relative">
          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
            className={selectDarkStyles}>
            <option value="" className="bg-[#141820] text-white">All Categories</option>
            {categories.map(c => <option key={c.id} value={c.id} className="bg-[#141820] text-white">{c.name}</option>)}
          </select>
        </div>

        <div className="relative">
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className={selectDarkStyles}>
            <option value="all" className="bg-[#141820] text-white">All Status</option>
            <option value="active" className="bg-[#141820] text-white">Active</option>
            <option value="inactive" className="bg-[#141820] text-white">Inactive</option>
            <option value="low_stock" className="bg-[#141820] text-white">Low Stock</option>
          </select>
        </div>
      </div>

      {/* Table — desktop */}
      {loading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="glow-card h-16 shimmer" />)}</div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <p className="text-red-400 text-sm font-medium">{error}</p>
          <button onClick={() => load()} className="px-4 py-2 rounded-xl text-xs font-semibold text-white glow-btn" style={{ background: 'linear-gradient(135deg, #FF8A00, #FF2EC9)' }}>Retry</button>
        </div>
      ) : (
        <>
          {/* Mobile card list */}
          <div className="lg:hidden space-y-2">
            {filtered.length === 0 && (
              <div className="glow-card py-16 text-center">
                <Package size={28} className="mx-auto mb-2 text-white/15" />
                <p className="text-sm text-white/25">No products found</p>
              </div>
            )}
            {filtered.map(p => {
              const primaryImg = p.images?.[p.primary_image_index] || p.image;
              return (
                <div
                  key={p.id}
                  className="glow-card p-3 flex items-center gap-3"
                  style={{ opacity: p.is_active ? 1 : 0.5 }}
                >
                  <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0"
                    style={{ background: '#141820', border: '1px solid rgba(255,255,255,0.06)' }}>
                    {primaryImg
                      ? <img src={primaryImg} alt="" className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      : <div className="w-full h-full flex items-center justify-center"><Package size={16} className="text-white/15" /></div>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-semibold truncate">{p.name}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {p.discount_price
                        ? <span className="text-xs font-bold text-mia-orange">৳{p.discount_price}</span>
                        : <span className="text-xs text-white/70">৳{p.price}</span>
                      }
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium ${
                        p.stock === 0 ? 'text-red-400 bg-red-500/10' : p.stock < 5 ? 'text-yellow-400 bg-yellow-500/10' : 'text-white/40 bg-white/5'}`}>
                        {p.stock === 0 ? 'Out' : `${p.stock} left`}
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium ${p.is_active ? 'text-green-400 bg-green-500/10' : 'text-white/30 bg-white/5'}`}>
                        {p.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    {p.category && <p className="text-[10px] text-white/30 mt-0.5">{p.category}</p>}
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    <button onClick={() => openEdit(p)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/5 hover:bg-white/10 transition-colors">
                      <Edit2 size={13} className="text-white/50" />
                    </button>
                    <button onClick={() => handleToggleActive(p)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                      style={{ background: p.is_active ? 'rgba(239,68,68,0.05)' : 'rgba(34,197,94,0.05)' }}>
                      {p.is_active ? <EyeOff size={13} className="text-red-400/60" /> : <Eye size={13} className="text-green-400/60" />}
                    </button>
                    <button onClick={() => setConfirmDelete(p)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center bg-red-500/5 hover:bg-red-500/10 transition-colors">
                      <Trash2 size={13} className="text-red-400/60" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop table */}
          <div className="hidden lg:block glow-card overflow-hidden">
            <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <th className="text-left px-4 py-3"><SortBtn k="name" label="Product" /></th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-white/30">Category / Brand</th>
                  <th className="text-left px-4 py-3"><SortBtn k="price" label="Price" /></th>
                  <th className="text-left px-4 py-3"><SortBtn k="stock" label="Stock" /></th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-white/30">Labels</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-white/30">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={7} className="text-center py-16 text-white/25 text-sm">
                    <Package size={28} className="mx-auto mb-2 opacity-20" />
                    No products found
                  </td></tr>
                )}
                {filtered.map(p => {
                  const primaryImg = p.images?.[p.primary_image_index] || p.image;
                  return (
                    <tr key={p.id}
                      className="transition-colors hover:bg-white/[0.015]"
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', opacity: p.is_active ? 1 : 0.5 }}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-xl overflow-hidden shrink-0"
                            style={{ background: '#141820', border: '1px solid rgba(255,255,255,0.06)' }}>
                            {primaryImg ? (
                              <img src={primaryImg} alt="" className="w-full h-full object-cover"
                                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package size={14} className="text-white/15" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="text-sm text-white/90 font-medium line-clamp-1 max-w-[150px]">{p.name}</p>
                            {p.sku && <p className="text-[10px] text-white/25 font-mono">{p.sku}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs text-white/60">{p.category || '—'}</p>
                        {p.brand && <p className="text-[10px] text-white/30">{p.brand}</p>}
                      </td>
                      <td className="px-4 py-3">
                        {p.discount_price ? (
                          <div>
                            <p className="text-sm font-bold text-mia-orange">৳{p.discount_price}</p>
                            <p className="text-[10px] text-white/25 line-through">৳{p.price}</p>
                          </div>
                        ) : (
                          <p className="text-sm font-medium text-white/80">৳{p.price}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-lg font-medium ${
                          p.stock === 0 ? 'text-red-400 bg-red-500/10 border border-red-500/20' :
                          p.stock < 5 ? 'text-yellow-400 bg-yellow-500/10 border border-yellow-500/20' :
                          'text-white/50 bg-white/5'}`}>
                          {p.stock === 0 ? 'Out of stock' : `${p.stock}`}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(FLAG_STYLES).map(([key, s]) =>
                            p[key] ? (
                              <span key={key} className="text-[9px] px-1.5 py-0.5 rounded-md font-medium"
                                style={{ color: s.color, background: `${s.color}12`, border: `1px solid ${s.color}25` }}>
                                {s.label}
                              </span>
                            ) : null
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] px-2 py-0.5 rounded-lg font-medium ${p.is_active ? 'text-green-400 bg-green-500/10 border border-green-500/20' : 'text-white/30 bg-white/5 border border-white/8'}`}>
                          {p.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          <button onClick={() => handleToggleActive(p)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                            style={{ background: p.is_active ? 'rgba(239,68,68,0.05)' : 'rgba(34,197,94,0.05)' }}
                            title={p.is_active ? 'Deactivate' : 'Activate'}>
                            {p.is_active ? <EyeOff size={13} className="text-red-400/60" /> : <Eye size={13} className="text-green-400/60" />}
                          </button>
                          <button onClick={() => openEdit(p)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/5 hover:bg-white/10 transition-colors">
                            <Edit2 size={13} className="text-white/50" />
                          </button>
                          <button onClick={() => setConfirmDelete(p)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center bg-red-500/5 hover:bg-red-500/10 transition-colors">
                            <Trash2 size={13} className="text-red-400/60" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          </div>
        </>
      )}

      {showForm && (
        <ProductForm
          editing={editing}
          categories={categories}
          brands={brands}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); load(); }}
        />
      )}

      {confirmDelete && (
        <ConfirmDialog
          title="Delete Product"
          message={`Permanently remove "${confirmDelete.name}"? This will hide it from the store.`}
          confirmLabel="Delete"
          danger
          onConfirm={() => handleDelete(confirmDelete.id)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}
