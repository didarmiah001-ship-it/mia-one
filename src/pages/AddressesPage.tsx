import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, MapPin, Trash2, Star } from 'lucide-react';
import { useNavigate } from '../lib/router';
import { useAuth } from '../lib/auth';
import { fetchAddresses, createAddress, deleteAddress, updateAddress } from '../lib/api';
import { useTranslation } from 'react-i18next';

export function AddressesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    label: 'Home', full_name: '', phone: '', address: '', area: '', city: '', notes: '',
  });

  useEffect(() => {
    if (!user) return;
    loadAddresses();
  }, [user]);

  const loadAddresses = async () => {
    if (!user) return;
    setLoading(true);
    const data = await fetchAddresses(user.id);
    setAddresses(data);
    setLoading(false);
  };

  if (!user) {
    navigate('/login');
    return null;
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    await createAddress({ ...formData, user_id: user.id, is_default: addresses.length === 0 });
    setShowForm(false);
    setFormData({ label: 'Home', full_name: '', phone: '', address: '', area: '', city: '', notes: '' });
    loadAddresses();
  };

  const handleDelete = async (id: string) => {
    await deleteAddress(id);
    loadAddresses();
  };

  const handleSetDefault = async (id: string) => {
    for (const addr of addresses) {
      if (addr.is_default) await updateAddress(addr.id, { is_default: false });
    }
    await updateAddress(id, { is_default: true });
    loadAddresses();
  };

  return (
    <div className="page-transition pb-24">
      <header className="sticky top-0 z-30 glass px-4 py-3">
        <div className="max-w-lg md:max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/profile')}
              className="w-9 h-9 rounded-xl flex items-center justify-center glow-hover"
              style={{ background: 'var(--bg-input)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <ArrowLeft size={16} className="text-white/60" />
            </button>
            <h1 className="text-lg font-bold text-white">{t('addresses.title')}</h1>
          </div>
          <button onClick={() => setShowForm(true)}
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(255,138,0,0.1)', border: '1px solid rgba(255,138,0,0.2)' }}>
            <Plus size={16} className="text-mia-orange" />
          </button>
        </div>
      </header>

      <div className="max-w-lg md:max-w-2xl mx-auto px-4 mt-4 space-y-3">
        {loading ? (
          <div className="text-center py-12 text-white/30 text-sm">{t('addresses.loading')}</div>
        ) : addresses.length === 0 && !showForm ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center float-premium"
              style={{ background: 'rgba(123,44,255,0.06)', border: '1px solid rgba(123,44,255,0.15)' }}>
              <MapPin size={24} className="text-mia-purple/50" />
            </div>
            <p className="text-sm text-white/40 mb-4">{t('addresses.empty')}</p>
            <button onClick={() => setShowForm(true)}
              className="px-5 py-2.5 rounded-xl text-sm font-medium text-white glow-btn"
              style={{ background: 'linear-gradient(135deg, #FF8A00, #FF2EC9)' }}>
              {t('addresses.addAddress')}
            </button>
          </div>
        ) : (
          addresses.map(addr => (
            <div key={addr.id} className="glow-card p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-lg"
                    style={{ background: 'rgba(255,138,0,0.1)', color: '#FF8A00' }}>
                    {addr.label}
                  </span>
                  {addr.is_default && (
                    <span className="text-[10px] text-mia-blue flex items-center gap-0.5">
                      <Star size={10} className="fill-mia-blue" /> {t('addresses.default')}
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  {!addr.is_default && (
                    <button onClick={() => handleSetDefault(addr.id)}
                      className="text-[10px] text-white/30 hover:text-mia-blue">{t('addresses.setDefault')}</button>
                  )}
                  <button onClick={() => handleDelete(addr.id)}
                    className="text-white/30 hover:text-red-400 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <p className="text-sm text-white/80 font-medium">{addr.full_name}</p>
              <p className="text-xs text-white/50 mt-1">{addr.address}</p>
              <p className="text-xs text-white/40">{addr.area}{addr.city ? `, ${addr.city}` : ''}</p>
              <p className="text-xs text-white/30 mt-1">{addr.phone}</p>
            </div>
          ))
        )}

        {/* Add form */}
        {showForm && (
          <form onSubmit={handleAdd} className="glow-card p-4 space-y-3">
            <h3 className="text-sm font-semibold text-white mb-2">{t('addresses.newAddress')}</h3>
            <div className="flex gap-2">
              {['Home', 'Work', 'Other'].map(l => (
                <button key={l} type="button" onClick={() => setFormData(p => ({ ...p, label: l }))}
                  className={`text-xs px-3 py-1.5 rounded-lg transition-all ${formData.label === l ? 'text-mia-orange' : 'text-white/40'}`}
                  style={formData.label === l ? { background: 'rgba(255,138,0,0.1)', border: '1px solid rgba(255,138,0,0.3)' } : { background: 'var(--bg-input)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  {l === 'Home' ? t('addresses.home') : l === 'Work' ? t('addresses.work') : t('addresses.other')}
                </button>
              ))}
            </div>
            <input value={formData.full_name} onChange={e => setFormData(p => ({ ...p, full_name: e.target.value }))}
              placeholder={t('addresses.fullName')} required
              className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/8 rounded-xl text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-mia-orange/40" />
            <input value={formData.phone} onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))}
              placeholder={t('addresses.phone')} required
              className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/8 rounded-xl text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-mia-orange/40" />
            <input value={formData.address} onChange={e => setFormData(p => ({ ...p, address: e.target.value }))}
              placeholder={t('addresses.fullAddress')} required
              className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/8 rounded-xl text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-mia-orange/40" />
            <div className="grid grid-cols-2 gap-2">
              <input value={formData.area} onChange={e => setFormData(p => ({ ...p, area: e.target.value }))}
                placeholder={t('addresses.area')} className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/8 rounded-xl text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-mia-orange/40" />
              <input value={formData.city} onChange={e => setFormData(p => ({ ...p, city: e.target.value }))}
                placeholder={t('addresses.city')} className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/8 rounded-xl text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-mia-orange/40" />
            </div>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setShowForm(false)}
                className="flex-1 py-2.5 rounded-xl text-sm text-white/50 border border-white/10">{t('addresses.cancel')}</button>
              <button type="submit"
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white glow-btn"
                style={{ background: 'linear-gradient(135deg, #FF8A00, #FF2EC9)' }}>{t('addresses.save')}</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
