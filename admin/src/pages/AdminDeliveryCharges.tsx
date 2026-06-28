import { useState, useEffect } from 'react';
import { adminFetchSettings, adminUpsertSettings } from '../lib/api';
import { useToast } from '../components/Toast';
import { Truck, MapPin, Zap, Save, TrendingUp } from 'lucide-react';

const DEFAULTS = {
  inside_dhaka: 60,
  outside_dhaka: 120,
  free_delivery_min: 500,
  express_delivery: 100,
  express_enabled: false,
};

export function AdminDeliveryCharges() {
  const toast = useToast();
  const [settings, setSettings] = useState<any>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminFetchSettings('delivery_charges').then(data => {
      if (data) setSettings({ ...DEFAULTS, ...data });
      setLoading(false);
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await adminUpsertSettings('delivery_charges', settings);
    if (error) toast.error(error);
    else toast.success('Delivery charges saved — new orders will use these rates');
    setSaving(false);
  };

  const update = (field: string, value: any) => setSettings((s: any) => ({ ...s, [field]: value }));

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-base font-bold text-white">Delivery Charges</h2>
        <div className="glow-card h-64 shimmer" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Truck size={18} className="text-mia-orange" />
        <h2 className="text-base font-bold text-white">Delivery Charges</h2>
      </div>

      <p className="text-xs text-white/40 -mt-2">
        Set delivery rates for different zones. Changes apply to all new orders instantly. Existing orders keep their original charge.
      </p>

      <form onSubmit={handleSave} className="space-y-4">
        {/* Zone Charges */}
        <div className="glow-card p-5">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,138,0,0.08)', border: '1px solid rgba(255,138,0,0.2)' }}>
              <MapPin size={15} className="text-mia-orange" />
            </div>
            <h3 className="text-sm font-semibold text-white">Delivery Zones</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] text-white/40 block mb-1.5">Inside Dhaka (৳)</label>
              <input
                type="number"
                min={0}
                value={settings.inside_dhaka}
                onChange={e => update('inside_dhaka', Number(e.target.value))}
                className="admin-input"
                placeholder="60"
              />
              <p className="text-[10px] text-white/25 mt-1">Charge for deliveries within Dhaka city</p>
            </div>
            <div>
              <label className="text-[11px] text-white/40 block mb-1.5">Outside Dhaka (৳)</label>
              <input
                type="number"
                min={0}
                value={settings.outside_dhaka}
                onChange={e => update('outside_dhaka', Number(e.target.value))}
                className="admin-input"
                placeholder="120"
              />
              <p className="text-[10px] text-white/25 mt-1">Charge for deliveries outside Dhaka</p>
            </div>
          </div>
        </div>

        {/* Free Delivery */}
        <div className="glow-card p-5">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}>
              <TrendingUp size={15} className="text-green-400" />
            </div>
            <h3 className="text-sm font-semibold text-white">Free Delivery Threshold</h3>
          </div>
          <div>
            <label className="text-[11px] text-white/40 block mb-1.5">Free Delivery Minimum Order (৳)</label>
            <input
              type="number"
              min={0}
              value={settings.free_delivery_min}
              onChange={e => update('free_delivery_min', Number(e.target.value))}
              className="admin-input"
              placeholder="500"
            />
            <p className="text-[10px] text-white/25 mt-1">
              Orders totaling ৳{settings.free_delivery_min} or more get free delivery automatically
            </p>
          </div>
        </div>

        {/* Express Delivery */}
        <div className="glow-card p-5">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(0,209,255,0.08)', border: '1px solid rgba(0,209,255,0.2)' }}>
                <Zap size={15} className="text-mia-blue" />
              </div>
              <h3 className="text-sm font-semibold text-white">Express Delivery (Optional)</h3>
            </div>
            <button
              type="button"
              onClick={() => update('express_enabled', !settings.express_enabled)}
              className="relative w-11 h-6 rounded-full transition-colors"
              style={{ background: settings.express_enabled ? '#FF8A00' : 'rgba(255,255,255,0.1)' }}
            >
              <div
                className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform"
                style={{ transform: settings.express_enabled ? 'translateX(22px)' : 'translateX(2px)' }}
              />
            </button>
          </div>
          {settings.express_enabled && (
            <div>
              <label className="text-[11px] text-white/40 block mb-1.5">Express Delivery Charge (৳)</label>
              <input
                type="number"
                min={0}
                value={settings.express_delivery}
                onChange={e => update('express_delivery', Number(e.target.value))}
                className="admin-input"
                placeholder="100"
              />
              <p className="text-[10px] text-white/25 mt-1">Additional charge for express/fast delivery option</p>
            </div>
          )}
        </div>

        {/* Save */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white glow-btn disabled:opacity-50 flex items-center gap-2"
            style={{ background: 'linear-gradient(135deg, #FF8A00, #FF2EC9)' }}
          >
            <Save size={15} />
            {saving ? 'Saving...' : 'Save Delivery Charges'}
          </button>
        </div>
      </form>
    </div>
  );
}
