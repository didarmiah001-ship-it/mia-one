import { useState, useEffect } from 'react';
import { adminFetchSettings, adminUpsertSettings } from '../../lib/api';
import { useToast } from '../../components/Toast';
import { Settings, Store, Globe } from 'lucide-react';

const STORE_DEFAULTS = {
  name: 'MIA ONE',
  phone: '',
  email: '',
  address: '',
  currency: '৳',
  delivery_charge: 60,
  free_delivery_threshold: 500,
  whatsapp: '',
};

const SEO_DEFAULTS = {
  title: 'MIA ONE — Everything You Need, One App',
  description: '',
  keywords: '',
};

export function AdminSettings() {
  const toast = useToast();
  const [store, setStore] = useState<any>(STORE_DEFAULTS);
  const [seo, setSeo] = useState<any>(SEO_DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [savingStore, setSavingStore] = useState(false);
  const [savingSeo, setSavingSeo] = useState(false);

  useEffect(() => {
    Promise.all([adminFetchSettings('store'), adminFetchSettings('seo')]).then(([s, e]) => {
      if (s) setStore({ ...STORE_DEFAULTS, ...s });
      if (e) setSeo({ ...SEO_DEFAULTS, ...e });
      setLoading(false);
    });
  }, []);

  const handleSaveStore = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingStore(true);
    const { error } = await adminUpsertSettings('store', store);
    if (error) toast.error(error); else toast.success('Store settings saved');
    setSavingStore(false);
  };

  const handleSaveSeo = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSeo(true);
    const { error } = await adminUpsertSettings('seo', seo);
    if (error) toast.error(error); else toast.success('SEO settings saved');
    setSavingSeo(false);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-base font-bold text-white">Settings</h2>
        <div className="space-y-4">{Array.from({ length: 2 }).map((_, i) => <div key={i} className="glow-card h-64 shimmer" />)}</div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <h2 className="text-base font-bold text-white">Settings</h2>

      {/* Store Settings */}
      <div className="glow-card p-5">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,138,0,0.08)', border: '1px solid rgba(255,138,0,0.2)' }}>
            <Store size={15} className="text-mia-orange" />
          </div>
          <h3 className="text-sm font-semibold text-white">Store Information</h3>
        </div>
        <form onSubmit={handleSaveStore} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-white/40 block mb-1">Store Name</label>
              <input value={store.name} onChange={e => setStore((s: any) => ({ ...s, name: e.target.value }))} className="admin-input" placeholder="MIA ONE" />
            </div>
            <div>
              <label className="text-[11px] text-white/40 block mb-1">Phone</label>
              <input value={store.phone} onChange={e => setStore((s: any) => ({ ...s, phone: e.target.value }))} className="admin-input" placeholder="+880..." />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-white/40 block mb-1">Email</label>
              <input type="email" value={store.email} onChange={e => setStore((s: any) => ({ ...s, email: e.target.value }))} className="admin-input" placeholder="hello@miaone.com" />
            </div>
            <div>
              <label className="text-[11px] text-white/40 block mb-1">WhatsApp Number</label>
              <input value={store.whatsapp} onChange={e => setStore((s: any) => ({ ...s, whatsapp: e.target.value }))} className="admin-input" placeholder="8801XXXXXXXXX" />
            </div>
          </div>
          <div>
            <label className="text-[11px] text-white/40 block mb-1">Address</label>
            <textarea value={store.address} onChange={e => setStore((s: any) => ({ ...s, address: e.target.value }))} className="admin-input resize-none" rows={2} placeholder="Dhaka, Bangladesh" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] text-white/40 block mb-1">Currency Symbol</label>
              <input value={store.currency} onChange={e => setStore((s: any) => ({ ...s, currency: e.target.value }))} className="admin-input" placeholder="৳" />
            </div>
            <div>
              <label className="text-[11px] text-white/40 block mb-1">Delivery Charge</label>
              <input type="number" value={store.delivery_charge} onChange={e => setStore((s: any) => ({ ...s, delivery_charge: Number(e.target.value) }))} className="admin-input" />
            </div>
            <div>
              <label className="text-[11px] text-white/40 block mb-1">Free Delivery Above</label>
              <input type="number" value={store.free_delivery_threshold} onChange={e => setStore((s: any) => ({ ...s, free_delivery_threshold: Number(e.target.value) }))} className="admin-input" />
            </div>
          </div>
          <div className="flex justify-end pt-1">
            <button type="submit" disabled={savingStore} className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white glow-btn disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #FF8A00, #FF2EC9)' }}>
              {savingStore ? 'Saving...' : 'Save Store Settings'}
            </button>
          </div>
        </form>
      </div>

      {/* SEO Settings */}
      <div className="glow-card p-5">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(0,209,255,0.08)', border: '1px solid rgba(0,209,255,0.2)' }}>
            <Globe size={15} className="text-mia-blue" />
          </div>
          <h3 className="text-sm font-semibold text-white">SEO & Meta</h3>
        </div>
        <form onSubmit={handleSaveSeo} className="space-y-3">
          <div>
            <label className="text-[11px] text-white/40 block mb-1">Page Title</label>
            <input value={seo.title} onChange={e => setSeo((s: any) => ({ ...s, title: e.target.value }))} className="admin-input" placeholder="MIA ONE — Everything You Need, One App" />
          </div>
          <div>
            <label className="text-[11px] text-white/40 block mb-1">Meta Description</label>
            <textarea value={seo.description} onChange={e => setSeo((s: any) => ({ ...s, description: e.target.value }))} className="admin-input resize-none" rows={3} placeholder="Shop the best products..." />
          </div>
          <div>
            <label className="text-[11px] text-white/40 block mb-1">Keywords</label>
            <input value={seo.keywords} onChange={e => setSeo((s: any) => ({ ...s, keywords: e.target.value }))} className="admin-input" placeholder="mia one, shopping, bangladesh" />
          </div>
          <div className="flex justify-end pt-1">
            <button type="submit" disabled={savingSeo} className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white glow-btn disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #00D1FF, #7B2CFF)' }}>
              {savingSeo ? 'Saving...' : 'Save SEO Settings'}
            </button>
          </div>
        </form>
      </div>

      {/* App Info */}
      <div className="glow-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Settings size={14} className="text-white/30" />
          <h3 className="text-sm font-semibold text-white/50">App Info</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[{ label: 'Version', value: '1.0.0' }, { label: 'Framework', value: 'React + Vite' }, { label: 'Database', value: 'Supabase' }, { label: 'Platform', value: 'PWA' }].map(item => (
            <div key={item.label} className="text-center p-3 rounded-xl bg-white/[0.02] border border-white/5">
              <p className="text-xs font-semibold text-white/70">{item.value}</p>
              <p className="text-[10px] text-white/30 mt-0.5">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
