import { useState, useRef, useCallback } from 'react';
import { X, Package, Upload, Trash2, ImagePlus, Star, ChevronDown, ChevronUp, Plus } from 'lucide-react';
import { adminCreateProduct, adminUpdateProduct } from '../../lib/api';
import { useToast } from '../../components/Toast';

interface ProductFormProps {
  editing: any | null;
  categories: any[];
  brands: any[];
  onClose: () => void;
  onSaved: () => void;
}

const EMPTY_FORM = {
  name: '',
  short_description: '',
  long_description: '',
  category_id: '',
  subcategory: '',
  brand_id: '',
  price: '',
  wholesale_price: '',
  discount_price: '',
  stock: '',
  sku: '',
  barcode: '',
  weight: '',
  colors: [] as string[],
  sizes: [] as string[],
  tags: [] as string[],
  images: [] as string[],
  primary_image_index: 0,
  is_active: true,
  is_featured: false,
  is_trending: false,
  is_new: false,
  is_best_selling: false,
};

type SectionKey = 'basic' | 'pricing' | 'inventory' | 'variants' | 'media' | 'status';

function Section({ title, open, onToggle, children }: { title: string; open: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.015)' }}>
      <button type="button" onClick={onToggle} className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/[0.02] transition-colors">
        <span className="text-sm font-semibold text-white/80">{title}</span>
        {open ? <ChevronUp size={14} className="text-white/40" /> : <ChevronDown size={14} className="text-white/40" />}
      </button>
      {open && <div className="px-4 pb-4 space-y-3">{children}</div>}
    </div>
  );
}

function TagInput({ label, values, onChange, placeholder }: { label: string; values: string[]; onChange: (v: string[]) => void; placeholder: string }) {
  const [input, setInput] = useState('');

  const add = () => {
    const v = input.trim();
    if (v && !values.includes(v)) { onChange([...values, v]); }
    setInput('');
  };

  return (
    <div>
      <label className="text-[11px] text-white/40 block mb-1">{label}</label>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {values.map(v => (
          <span key={v} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-white/[0.06] text-white/70 border border-white/8">
            {v}
            <button type="button" onClick={() => onChange(values.filter(x => x !== v))} className="text-white/30 hover:text-red-400 transition-colors">
              <X size={10} />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }} placeholder={placeholder} className="admin-input flex-1" />
        <button type="button" onClick={add} className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 border border-white/8 transition-colors">
          <Plus size={14} className="text-white/50" />
        </button>
      </div>
    </div>
  );
}

function ImageUploadZone({ images, primaryIndex, onChange, onPrimaryChange }: {
  images: string[];
  primaryIndex: number;
  onChange: (imgs: string[]) => void;
  onPrimaryChange: (i: number) => void;
}) {
  const [urlInput, setUrlInput] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const compressImage = (file: File): Promise<string> => {
    return new Promise(resolve => {
      const canvas = document.createElement('canvas');
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const MAX = 1200;
        let { width, height } = img;
        if (width > MAX || height > MAX) {
          const ratio = Math.min(MAX / width, MAX / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.src = url;
    });
  };

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files) return;
    const newImgs: string[] = [];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue;
      const compressed = await compressImage(file);
      newImgs.push(compressed);
    }
    onChange([...images, ...newImgs]);
  }, [images, onChange]);

  const addUrl = () => {
    const v = urlInput.trim();
    if (v && !images.includes(v)) { onChange([...images, v]); }
    setUrlInput('');
  };

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
        onClick={() => fileInputRef.current?.click()}
        className="flex flex-col items-center justify-center gap-2 rounded-2xl cursor-pointer transition-all"
        style={{
          border: `2px dashed ${dragOver ? 'rgba(255,138,0,0.5)' : 'rgba(255,255,255,0.1)'}`,
          background: dragOver ? 'rgba(255,138,0,0.04)' : 'rgba(255,255,255,0.02)',
          padding: '24px',
        }}
      >
        <ImagePlus size={24} className="text-white/25" />
        <p className="text-xs text-white/40 text-center">Drag & drop images or <span className="text-mia-orange">click to upload</span></p>
        <p className="text-[10px] text-white/20">JPG, PNG, WebP — auto-compressed to 1200px</p>
        <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={e => handleFiles(e.target.files)} />
      </div>

      {/* URL input */}
      <div className="flex gap-2">
        <input value={urlInput} onChange={e => setUrlInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addUrl(); } }} placeholder="Or paste image URL..." className="admin-input flex-1" />
        <button type="button" onClick={addUrl} className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 border border-white/8 transition-colors">
          <Upload size={13} className="text-white/50" />
        </button>
      </div>

      {/* Image grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {images.map((src, i) => (
            <div key={i} className="relative group aspect-square rounded-xl overflow-hidden"
              style={{ border: i === primaryIndex ? '2px solid #FF8A00' : '2px solid rgba(255,255,255,0.08)', background: '#0D1117' }}>
              <img src={src} alt="" className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              {/* Primary badge */}
              {i === primaryIndex && (
                <div className="absolute top-1 left-1 bg-mia-orange rounded-md px-1.5 py-0.5">
                  <Star size={8} className="text-white" fill="white" />
                </div>
              )}
              {/* Actions */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                <button type="button" onClick={() => onPrimaryChange(i)} title="Set as primary"
                  className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                  style={{ background: i === primaryIndex ? 'rgba(255,138,0,0.3)' : 'rgba(255,255,255,0.1)' }}>
                  <Star size={11} className={i === primaryIndex ? 'text-mia-orange' : 'text-white/60'} />
                </button>
                <button type="button" onClick={() => { const next = images.filter((_, idx) => idx !== i); onChange(next); if (primaryIndex >= next.length) onPrimaryChange(Math.max(0, next.length - 1)); }}
                  className="w-7 h-7 rounded-lg bg-red-500/20 flex items-center justify-center hover:bg-red-500/30 transition-colors">
                  <Trash2 size={11} className="text-red-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function ProductForm({ editing, categories, brands, onClose, onSaved }: ProductFormProps) {
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [sections, setSections] = useState<Record<SectionKey, boolean>>({
    basic: true, pricing: true, inventory: true, variants: false, media: true, status: true,
  });

  const toForm = (p: any) => ({
    name: p.name || '',
    short_description: p.short_description || '',
    long_description: p.long_description || '',
    category_id: p.category_id || '',
    subcategory: p.subcategory || '',
    brand_id: p.brand_id || '',
    price: p.price ? String(p.price) : '',
    wholesale_price: p.wholesale_price ? String(p.wholesale_price) : '',
    discount_price: p.discount_price ? String(p.discount_price) : '',
    stock: p.stock !== undefined ? String(p.stock) : '',
    sku: p.sku || '',
    barcode: p.barcode || '',
    weight: p.weight ? String(p.weight) : '',
    colors: p.colors || [],
    sizes: p.sizes || [],
    tags: p.tags || [],
    images: p.images || (p.image ? [p.image] : []),
    primary_image_index: p.primary_image_index || 0,
    is_active: p.is_active !== undefined ? p.is_active : true,
    is_featured: p.is_featured || false,
    is_trending: p.is_trending || false,
    is_new: p.is_new || false,
    is_best_selling: p.is_best_selling || false,
  });

  const [form, setForm] = useState(editing ? toForm(editing) : EMPTY_FORM);

  const toggle = (key: SectionKey) => setSections(s => ({ ...s, [key]: !s[key] }));
  const set = (field: string, value: any) => setForm(f => ({ ...f, [field]: value }));

  const validate = () => {
    if (!form.name.trim()) return 'Product name is required';
    if (!form.price || Number(form.price) <= 0) return 'Retail price must be greater than 0';
    if (form.discount_price && Number(form.discount_price) >= Number(form.price)) return 'Sale price must be less than retail price';
    if (form.wholesale_price && Number(form.wholesale_price) >= Number(form.price)) return 'Wholesale price must be less than retail price';
    if (!form.stock || Number(form.stock) < 0) return 'Stock must be 0 or more';
    if (form.images.length === 0) return 'At least one product image is required';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) { toast.error(err); return; }
    setSaving(true);

    const primaryImg = form.images[form.primary_image_index] || form.images[0] || '';
    const payload: any = {
      name: form.name.trim(),
      short_description: form.short_description.trim(),
      long_description: form.long_description.trim(),
      description: form.short_description.trim() || form.long_description.trim(),
      category_id: form.category_id || null,
      subcategory: form.subcategory,
      brand_id: form.brand_id || null,
      price: Number(form.price),
      wholesale_price: form.wholesale_price ? Number(form.wholesale_price) : null,
      discount_price: form.discount_price ? Number(form.discount_price) : null,
      stock: Number(form.stock),
      sku: form.sku,
      barcode: form.barcode,
      weight: form.weight ? Number(form.weight) : null,
      colors: form.colors,
      sizes: form.sizes,
      tags: form.tags,
      images: form.images,
      image: primaryImg,
      primary_image_index: form.primary_image_index,
      is_active: form.is_active,
      is_featured: form.is_featured,
      is_trending: form.is_trending,
      is_new: form.is_new,
      is_best_selling: form.is_best_selling,
    };

    if (editing) {
      const { error } = await adminUpdateProduct(editing.id, payload);
      if (error) { toast.error(error); } else { toast.success('Product updated'); onSaved(); }
    } else {
      const { error } = await adminCreateProduct({ ...payload, rating: 0, reviews_count: 0 });
      if (error) { toast.error(error); } else { toast.success('Product created'); onSaved(); }
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-[9980] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />
      <form onSubmit={handleSubmit} className="relative w-full max-w-2xl max-h-[92vh] flex flex-col rounded-3xl"
        style={{ background: 'linear-gradient(145deg, #141820, #0D1117)', border: '1px solid rgba(255,255,255,0.07)', boxShadow: '0 32px 80px rgba(0,0,0,0.6)' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.05] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,138,0,0.08)', border: '1px solid rgba(255,138,0,0.2)' }}>
              <Package size={15} className="text-mia-orange" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">{editing ? 'Edit Product' : 'New Product'}</h3>
              <p className="text-[10px] text-white/30">Fill in the product details below</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
            <X size={14} className="text-white/60" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-3">

          {/* Basic Info */}
          <Section title="Basic Information" open={sections.basic} onToggle={() => toggle('basic')}>
            <div>
              <label className="text-[11px] text-white/40 block mb-1">Product Name <span className="text-red-400">*</span></label>
              <input required value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Premium Wireless Headphones" className="admin-input" />
            </div>
            <div>
              <label className="text-[11px] text-white/40 block mb-1">Short Description</label>
              <textarea value={form.short_description} onChange={e => set('short_description', e.target.value)} placeholder="Brief summary shown in product cards..." rows={2} className="admin-input resize-none" />
            </div>
            <div>
              <label className="text-[11px] text-white/40 block mb-1">Long Description</label>
              <textarea value={form.long_description} onChange={e => set('long_description', e.target.value)} placeholder="Detailed product description, features, benefits..." rows={4} className="admin-input resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-white/40 block mb-1">Category</label>
                <select value={form.category_id} onChange={e => set('category_id', e.target.value)} className="admin-input">
                  <option value="">Select Category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[11px] text-white/40 block mb-1">Subcategory</label>
                <input value={form.subcategory} onChange={e => set('subcategory', e.target.value)} placeholder="e.g. Over-ear" className="admin-input" />
              </div>
            </div>
            <div>
              <label className="text-[11px] text-white/40 block mb-1">Brand</label>
              <select value={form.brand_id} onChange={e => set('brand_id', e.target.value)} className="admin-input">
                <option value="">Select Brand</option>
                {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <TagInput label="Tags" values={form.tags} onChange={v => set('tags', v)} placeholder="Add tag and press Enter..." />
          </Section>

          {/* Pricing */}
          <Section title="Pricing" open={sections.pricing} onToggle={() => toggle('pricing')}>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] text-white/40 block mb-1">Retail Price (৳) <span className="text-red-400">*</span></label>
                <input required type="number" min="0.01" step="0.01" value={form.price} onChange={e => set('price', e.target.value)} placeholder="0.00" className="admin-input" />
              </div>
              <div>
                <label className="text-[11px] text-white/40 block mb-1">Wholesale Price (৳)</label>
                <input type="number" min="0" step="0.01" value={form.wholesale_price} onChange={e => set('wholesale_price', e.target.value)} placeholder="0.00" className="admin-input" />
              </div>
              <div>
                <label className="text-[11px] text-white/40 block mb-1">Sale Price (৳)</label>
                <input type="number" min="0" step="0.01" value={form.discount_price} onChange={e => set('discount_price', e.target.value)} placeholder="0.00" className="admin-input" />
              </div>
            </div>
            {form.discount_price && form.price && Number(form.discount_price) > 0 && Number(form.price) > 0 && (
              <p className="text-[11px] text-mia-orange">
                Discount: {Math.round(((Number(form.price) - Number(form.discount_price)) / Number(form.price)) * 100)}% off
              </p>
            )}
          </Section>

          {/* Inventory */}
          <Section title="Inventory & Identification" open={sections.inventory} onToggle={() => toggle('inventory')}>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-white/40 block mb-1">Stock Quantity <span className="text-red-400">*</span></label>
                <input required type="number" min="0" value={form.stock} onChange={e => set('stock', e.target.value)} placeholder="0" className="admin-input" />
              </div>
              <div>
                <label className="text-[11px] text-white/40 block mb-1">Weight (kg)</label>
                <input type="number" min="0" step="0.001" value={form.weight} onChange={e => set('weight', e.target.value)} placeholder="0.000" className="admin-input" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-white/40 block mb-1">SKU</label>
                <input value={form.sku} onChange={e => set('sku', e.target.value)} placeholder="e.g. WH-001-BLK" className="admin-input font-mono" />
              </div>
              <div>
                <label className="text-[11px] text-white/40 block mb-1">Barcode (EAN/UPC)</label>
                <input value={form.barcode} onChange={e => set('barcode', e.target.value)} placeholder="e.g. 1234567890123" className="admin-input font-mono" />
              </div>
            </div>
          </Section>

          {/* Variants */}
          <Section title="Colors & Sizes" open={sections.variants} onToggle={() => toggle('variants')}>
            <TagInput label="Colors" values={form.colors} onChange={v => set('colors', v)} placeholder="e.g. Black, White, Red..." />
            <TagInput label="Sizes" values={form.sizes} onChange={v => set('sizes', v)} placeholder="e.g. S, M, L, XL..." />
          </Section>

          {/* Media */}
          <Section title="Product Images" open={sections.media} onToggle={() => toggle('media')}>
            <p className="text-[11px] text-white/30 -mt-1">Upload multiple images. Click the star to set the primary image. <span className="text-red-400">At least 1 required.</span></p>
            <ImageUploadZone
              images={form.images}
              primaryIndex={form.primary_image_index}
              onChange={imgs => set('images', imgs)}
              onPrimaryChange={i => set('primary_image_index', i)}
            />
          </Section>

          {/* Status */}
          <Section title="Status & Labels" open={sections.status} onToggle={() => toggle('status')}>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: 'is_active', label: 'Active', desc: 'Visible in store', color: '#22c55e' },
                { key: 'is_featured', label: 'Featured', desc: 'Show in featured', color: '#FF8A00' },
                { key: 'is_best_selling', label: 'Best Selling', desc: 'Mark as bestseller', color: '#FF2EC9' },
                { key: 'is_new', label: 'New Arrival', desc: 'Show in new arrivals', color: '#00D1FF' },
                { key: 'is_trending', label: 'Trending', desc: 'Show in trending', color: '#7B2CFF' },
              ].map(flag => (
                <button key={flag.key} type="button"
                  onClick={() => set(flag.key, !(form as any)[flag.key])}
                  className="flex items-center gap-3 p-3 rounded-xl text-left transition-all"
                  style={{
                    background: (form as any)[flag.key] ? `${flag.color}10` : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${(form as any)[flag.key] ? `${flag.color}30` : 'rgba(255,255,255,0.06)'}`,
                  }}>
                  <div className="w-4 h-4 rounded-md flex items-center justify-center shrink-0 transition-all"
                    style={{ background: (form as any)[flag.key] ? flag.color : 'rgba(255,255,255,0.08)' }}>
                    {(form as any)[flag.key] && (
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-medium" style={{ color: (form as any)[flag.key] ? flag.color : 'rgba(255,255,255,0.6)' }}>{flag.label}</p>
                    <p className="text-[10px] text-white/25">{flag.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </Section>

        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 px-6 py-4 border-t border-white/[0.05] shrink-0">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white/50 bg-white/5 hover:bg-white/[0.08] transition-colors border border-white/8">
            Cancel
          </button>
          <button type="submit" disabled={saving}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white glow-btn disabled:opacity-50 transition-all"
            style={{ background: 'linear-gradient(135deg, #FF8A00, #FF2EC9)' }}>
            {saving ? 'Saving...' : editing ? 'Update Product' : 'Create Product'}
          </button>
        </div>
      </form>
    </div>
  );
}
