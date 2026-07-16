import { useState, useEffect } from 'react';
import { adminFetchSettings, adminUpsertSettings } from '../lib/api';
import { useToast } from '../components/Toast';
import {
  Settings, Store, Globe, Truck, FileText, Share2, Target,
  MapPin, DollarSign, Facebook, Instagram, Youtube, Twitter,
} from 'lucide-react';

const STORE_DEFAULTS = {
  name: 'MIA ONE',
  phone: '',
  email: '',
  address: '',
  currency: '৳',
  delivery_charge: 60,
  free_delivery_threshold: 500,
  whatsapp: '',
  munshiganj_free_delivery: true,
  outside_dhaka_charge: 120,
};

const SEO_DEFAULTS = {
  title: 'MIA ONE — Everything You Need, One App',
  description: '',
  keywords: '',
  og_image: '',
  favicon: '',
  robots: 'index, follow',
  google_analytics_id: '',
  facebook_pixel_id: '',
};

const SOCIAL_DEFAULTS = {
  facebook: '',
  instagram: '',
  youtube: '',
  twitter: '',
  tiktok: '',
  linkedin: '',
};

const INVOICE_DEFAULTS = {
  prefix: 'MIA',
  starting_number: 1001,
  show_logo: true,
  show_qr: true,
  footer_note: 'Thank you for shopping with MIA ONE!',
  tax_rate: 0,
  show_vat: false,
};

const TARGET_DEFAULTS = {
  monthly_sales_target: 100000,
  monthly_profit_target: 30000,
  daily_order_target: 50,
};

function SectionCard({ icon: Icon, title, subtitle, accent, children }: {
  icon: any; title: string; subtitle?: string; accent: string; children: React.ReactNode;
}) {
  return (
    <div className="glow-card p-5">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${accent}15`, border: `1px solid ${accent}30` }}>
          <Icon size={15} style={{ color: accent }} />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">{title}</h3>
          {subtitle && <p className="text-[11px] text-white/30">{subtitle}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-xs text-white/60">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className="relative w-10 h-5 rounded-full transition-colors"
        style={{ background: checked ? 'linear-gradient(135deg, #FF8A00, #FF2EC9)' : 'rgba(255,255,255,0.08)' }}
      >
        <span
          className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform"
          style={{ transform: checked ? 'translateX(22px)' : 'translateX(2px)' }}
        />
      </button>
    </div>
  );
}

export function AdminSettings() {
  const toast = useToast();
  const [store, setStore] = useState<any>(STORE_DEFAULTS);
  const [seo, setSeo] = useState<any>(SEO_DEFAULTS);
  const [social, setSocial] = useState<any>(SOCIAL_DEFAULTS);
  const [invoice, setInvoice] = useState<any>(INVOICE_DEFAULTS);
  const [targets, setTargets] = useState<any>(TARGET_DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      adminFetchSettings('store'),
      adminFetchSettings('seo'),
      adminFetchSettings('social'),
      adminFetchSettings('invoice'),
      adminFetchSettings('targets'),
    ]).then(([s, e, soc, inv, tgt]) => {
      if (s) setStore({ ...STORE_DEFAULTS, ...s });
      if (e) setSeo({ ...SEO_DEFAULTS, ...e });
      if (soc) setSocial({ ...SOCIAL_DEFAULTS, ...soc });
      if (inv) setInvoice({ ...INVOICE_DEFAULTS, ...inv });
      if (tgt) setTargets({ ...TARGET_DEFAULTS, ...tgt });
      setLoading(false);
    });
  }, []);

  const handleSave = async (key: string, data: any) => {
    setSaving(key);
    const { error } = await adminUpsertSettings(key, data);
    if (error) toast.error(error);
    else toast.success(`${key.charAt(0).toUpperCase() + key.slice(1)} settings saved`);
    setSaving(null);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-base font-bold text-white">Settings</h2>
        <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="glow-card h-64 shimmer" />)}</div>
      </div>
    );
  }

  const inputCls = 'admin-input';
  const labelCls = 'text-[11px] text-white/40 block mb-1';

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-white">Settings</h2>
        <p className="text-xs text-white/30 mt-0.5">Store, SEO, delivery, and invoice configuration</p>
      </div>

      {/* Store Information */}
      <SectionCard icon={Store} title="Store Information" subtitle="Basic store details" accent="#FF8A00">
        <form onSubmit={e => { e.preventDefault(); handleSave('store', store); }} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Store Name</label>
              <input value={store.name} onChange={e => setStore((s: any) => ({ ...s, name: e.target.value }))} className={inputCls} placeholder="MIA ONE" />
            </div>
            <div>
              <label className={labelCls}>Phone</label>
              <input value={store.phone} onChange={e => setStore((s: any) => ({ ...s, phone: e.target.value }))} className={inputCls} placeholder="+880..." />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Email</label>
              <input type="email" value={store.email} onChange={e => setStore((s: any) => ({ ...s, email: e.target.value }))} className={inputCls} placeholder="hello@miaone.com" />
            </div>
            <div>
              <label className={labelCls}>WhatsApp Number</label>
              <input value={store.whatsapp} onChange={e => setStore((s: any) => ({ ...s, whatsapp: e.target.value }))} className={inputCls} placeholder="8801XXXXXXXXX" />
            </div>
          </div>
          <div>
            <label className={labelCls}>Address</label>
            <textarea value={store.address} onChange={e => setStore((s: any) => ({ ...s, address: e.target.value }))} className={`${inputCls} resize-none`} rows={2} placeholder="Dhaka, Bangladesh" />
          </div>
          <div>
            <label className={labelCls}>Currency Symbol</label>
            <input value={store.currency} onChange={e => setStore((s: any) => ({ ...s, currency: e.target.value }))} className={inputCls} placeholder="৳" />
          </div>
          <div className="flex justify-end pt-1">
            <button type="submit" disabled={saving === 'store'} className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #FF8A00, #FF2EC9)' }}>
              {saving === 'store' ? 'Saving...' : 'Save Store Settings'}
            </button>
          </div>
        </form>
      </SectionCard>

      {/* Delivery Charges */}
      <SectionCard icon={Truck} title="Delivery Charges" subtitle="Configure delivery pricing" accent="#00D1FF">
        <form onSubmit={e => { e.preventDefault(); handleSave('store', { ...store }); }} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className={labelCls}>Inside Dhaka Charge (৳)</label>
              <input type="number" value={store.delivery_charge} onChange={e => setStore((s: any) => ({ ...s, delivery_charge: Number(e.target.value) }))} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Outside Dhaka Charge (৳)</label>
              <input type="number" value={store.outside_dhaka_charge} onChange={e => setStore((s: any) => ({ ...s, outside_dhaka_charge: Number(e.target.value) }))} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Free Delivery Above (৳)</label>
              <input type="number" value={store.free_delivery_threshold} onChange={e => setStore((s: any) => ({ ...s, free_delivery_threshold: Number(e.target.value) }))} className={inputCls} />
            </div>
          </div>
          <div className="rounded-xl p-3" style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)' }}>
            <Toggle
              checked={store.munshiganj_free_delivery}
              onChange={v => setStore((s: any) => ({ ...s, munshiganj_free_delivery: v }))}
              label="Free delivery for Munshiganj area"
            />
            <p className="text-[10px] text-green-400/60 pl-0.5">Customers with Munshiganj address get free delivery regardless of order value</p>
          </div>
          <div className="flex justify-end pt-1">
            <button type="submit" disabled={saving === 'store'} className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #00D1FF, #7B2CFF)' }}>
              {saving === 'store' ? 'Saving...' : 'Save Delivery Settings'}
            </button>
          </div>
        </form>
      </SectionCard>

      {/* SEO & Meta */}
      <SectionCard icon={Globe} title="SEO & Meta" subtitle="Search engine optimization" accent="#7B2CFF">
        <form onSubmit={e => { e.preventDefault(); handleSave('seo', seo); }} className="space-y-3">
          <div>
            <label className={labelCls}>Page Title</label>
            <input value={seo.title} onChange={e => setSeo((s: any) => ({ ...s, title: e.target.value }))} className={inputCls} placeholder="MIA ONE — Everything You Need, One App" />
          </div>
          <div>
            <label className={labelCls}>Meta Description</label>
            <textarea value={seo.description} onChange={e => setSeo((s: any) => ({ ...s, description: e.target.value }))} className={`${inputCls} resize-none`} rows={3} placeholder="Shop the best products..." />
          </div>
          <div>
            <label className={labelCls}>Keywords (comma-separated)</label>
            <input value={seo.keywords} onChange={e => setSeo((s: any) => ({ ...s, keywords: e.target.value }))} className={inputCls} placeholder="mia one, shopping, bangladesh" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>OG Image URL</label>
              <input value={seo.og_image} onChange={e => setSeo((s: any) => ({ ...s, og_image: e.target.value }))} className={inputCls} placeholder="https://..." />
            </div>
            <div>
              <label className={labelCls}>Favicon URL</label>
              <input value={seo.favicon} onChange={e => setSeo((s: any) => ({ ...s, favicon: e.target.value }))} className={inputCls} placeholder="https://..." />
            </div>
          </div>
          <div>
            <label className={labelCls}>Robots Meta</label>
            <input value={seo.robots} onChange={e => setSeo((s: any) => ({ ...s, robots: e.target.value }))} className={inputCls} placeholder="index, follow" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Google Analytics ID</label>
              <input value={seo.google_analytics_id} onChange={e => setSeo((s: any) => ({ ...s, google_analytics_id: e.target.value }))} className={inputCls} placeholder="G-XXXXXXX" />
            </div>
            <div>
              <label className={labelCls}>Facebook Pixel ID</label>
              <input value={seo.facebook_pixel_id} onChange={e => setSeo((s: any) => ({ ...s, facebook_pixel_id: e.target.value }))} className={inputCls} placeholder="1234567890" />
            </div>
          </div>
          <div className="flex justify-end pt-1">
            <button type="submit" disabled={saving === 'seo'} className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #7B2CFF, #FF2EC9)' }}>
              {saving === 'seo' ? 'Saving...' : 'Save SEO Settings'}
            </button>
          </div>
        </form>
      </SectionCard>

      {/* Social Links */}
      <SectionCard icon={Share2} title="Social Media Links" subtitle="Connect your social profiles" accent="#FF2EC9">
        <form onSubmit={e => { e.preventDefault(); handleSave('social', social); }} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelCls}><Facebook size={10} className="inline mr-1" />Facebook</label>
              <input value={social.facebook} onChange={e => setSocial((s: any) => ({ ...s, facebook: e.target.value }))} className={inputCls} placeholder="https://facebook.com/..." />
            </div>
            <div>
              <label className={labelCls}><Instagram size={10} className="inline mr-1" />Instagram</label>
              <input value={social.instagram} onChange={e => setSocial((s: any) => ({ ...s, instagram: e.target.value }))} className={inputCls} placeholder="https://instagram.com/..." />
            </div>
            <div>
              <label className={labelCls}><Youtube size={10} className="inline mr-1" />YouTube</label>
              <input value={social.youtube} onChange={e => setSocial((s: any) => ({ ...s, youtube: e.target.value }))} className={inputCls} placeholder="https://youtube.com/..." />
            </div>
            <div>
              <label className={labelCls}><Twitter size={10} className="inline mr-1" />Twitter / X</label>
              <input value={social.twitter} onChange={e => setSocial((s: any) => ({ ...s, twitter: e.target.value }))} className={inputCls} placeholder="https://x.com/..." />
            </div>
            <div>
              <label className={labelCls}>TikTok</label>
              <input value={social.tiktok} onChange={e => setSocial((s: any) => ({ ...s, tiktok: e.target.value }))} className={inputCls} placeholder="https://tiktok.com/..." />
            </div>
            <div>
              <label className={labelCls}>LinkedIn</label>
              <input value={social.linkedin} onChange={e => setSocial((s: any) => ({ ...s, linkedin: e.target.value }))} className={inputCls} placeholder="https://linkedin.com/..." />
            </div>
          </div>
          <div className="flex justify-end pt-1">
            <button type="submit" disabled={saving === 'social'} className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #FF2EC9, #FF8A00)' }}>
              {saving === 'social' ? 'Saving...' : 'Save Social Links'}
            </button>
          </div>
        </form>
      </SectionCard>

      {/* Invoice Customization */}
      <SectionCard icon={FileText} title="Invoice Customization" subtitle="Customize order invoices" accent="#22c55e">
        <form onSubmit={e => { e.preventDefault(); handleSave('invoice', invoice); }} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Invoice Prefix</label>
              <input value={invoice.prefix} onChange={e => setInvoice((s: any) => ({ ...s, prefix: e.target.value }))} className={inputCls} placeholder="MIA" />
            </div>
            <div>
              <label className={labelCls}>Starting Number</label>
              <input type="number" value={invoice.starting_number} onChange={e => setInvoice((s: any) => ({ ...s, starting_number: Number(e.target.value) }))} className={inputCls} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Footer Note</label>
            <textarea value={invoice.footer_note} onChange={e => setInvoice((s: any) => ({ ...s, footer_note: e.target.value }))} className={`${inputCls} resize-none`} rows={2} placeholder="Thank you for shopping!" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>VAT / Tax Rate (%)</label>
              <input type="number" min="0" max="100" step="0.01" value={invoice.tax_rate} onChange={e => setInvoice((s: any) => ({ ...s, tax_rate: Number(e.target.value) }))} className={inputCls} />
            </div>
          </div>
          <div className="rounded-xl p-3 space-y-1" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <Toggle checked={invoice.show_logo} onChange={v => setInvoice((s: any) => ({ ...s, show_logo: v }))} label="Show logo on invoice" />
            <Toggle checked={invoice.show_qr} onChange={v => setInvoice((s: any) => ({ ...s, show_qr: v }))} label="Show QR code on invoice" />
            <Toggle checked={invoice.show_vat} onChange={v => setInvoice((s: any) => ({ ...s, show_vat: v }))} label="Show VAT/TAX breakdown" />
          </div>
          <div className="flex justify-end pt-1">
            <button type="submit" disabled={saving === 'invoice'} className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #22c55e, #00D1FF)' }}>
              {saving === 'invoice' ? 'Saving...' : 'Save Invoice Settings'}
            </button>
          </div>
        </form>
      </SectionCard>

      {/* Sales Targets */}
      <SectionCard icon={Target} title="Sales Targets" subtitle="Monthly and daily goals" accent="#f59e0b">
        <form onSubmit={e => { e.preventDefault(); handleSave('targets', targets); }} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className={labelCls}>Monthly Sales Target (৳)</label>
              <input type="number" value={targets.monthly_sales_target} onChange={e => setTargets((s: any) => ({ ...s, monthly_sales_target: Number(e.target.value) }))} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Monthly Profit Target (৳)</label>
              <input type="number" value={targets.monthly_profit_target} onChange={e => setTargets((s: any) => ({ ...s, monthly_profit_target: Number(e.target.value) }))} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Daily Order Target</label>
              <input type="number" value={targets.daily_order_target} onChange={e => setTargets((s: any) => ({ ...s, daily_order_target: Number(e.target.value) }))} className={inputCls} />
            </div>
          </div>
          <div className="flex justify-end pt-1">
            <button type="submit" disabled={saving === 'targets'} className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #f59e0b, #FF8A00)' }}>
              {saving === 'targets' ? 'Saving...' : 'Save Targets'}
            </button>
          </div>
        </form>
      </SectionCard>

      {/* App Info */}
      <div className="glow-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Settings size={14} className="text-white/30" />
          <h3 className="text-sm font-semibold text-white/50">App Info</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Version', value: '2.0.0' },
            { label: 'Framework', value: 'React + Vite' },
            { label: 'Database', value: 'Firebase' },
            { label: 'Platform', value: 'PWA' },
          ].map(item => (
            <div key={item.label} className="text-center p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <p className="text-xs font-semibold text-white/70">{item.value}</p>
              <p className="text-[10px] text-white/30 mt-0.5">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
