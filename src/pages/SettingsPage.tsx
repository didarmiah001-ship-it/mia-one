import { useState, useEffect } from 'react';
import {
  ArrowLeft, Bell, Globe, Shield, Trash2, ChevronRight,
  Volume2, Smartphone, Info, ExternalLink, MessageCircle,
  FileText, RotateCcw, Phone,
} from 'lucide-react';
import { useNavigate } from '../lib/router';
import { useAuth } from '../lib/auth';
import { appConfig } from '../lib/config';
import { MiaAgent } from '../components/MiaAgent';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { useTranslation } from 'react-i18next';

const SETTINGS_KEY = 'mia-one-settings';

interface AppSettings {
  notifications_order: boolean;
  notifications_promo: boolean;
  notifications_system: boolean;
  sound_effects: boolean;
  language: string;
  currency: string;
}

const defaultSettings: AppSettings = {
  notifications_order: true,
  notifications_promo: true,
  notifications_system: true,
  sound_effects: false,
  language: 'English',
  currency: 'BDT (৳)',
};

function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return defaultSettings;
    return { ...defaultSettings, ...JSON.parse(raw) };
  } catch {
    return defaultSettings;
  }
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      className="relative w-11 h-6 rounded-full transition-all duration-300 shrink-0"
      style={{
        background: on
          ? 'linear-gradient(135deg, #FF8A00, #FF2EC9)'
          : 'rgba(255,255,255,0.08)',
        boxShadow: on ? '0 0 12px rgba(255,138,0,0.3)' : 'none',
      }}>
      <div
        className="absolute top-0.5 w-5 h-5 rounded-full transition-all duration-300"
        style={{
          background: 'white',
          left: on ? 'calc(100% - 22px)' : '2px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
        }}
      />
    </button>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-semibold text-white/25 uppercase tracking-widest mb-2 px-1">{title}</p>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function SettingRow({
  icon: Icon,
  color,
  label,
  sublabel,
  right,
}: {
  icon: React.ElementType;
  color: string;
  label: string;
  sublabel?: string;
  right: React.ReactNode;
}) {
  return (
    <div
      className="flex items-center gap-3 px-4 py-3.5 rounded-2xl"
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: `${color}10`, border: `1px solid ${color}18` }}>
        <Icon size={16} style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white/80 font-medium">{label}</p>
        {sublabel && <p className="text-[11px] text-white/30 mt-0.5">{sublabel}</p>}
      </div>
      {right}
    </div>
  );
}

export function SettingsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [settings, setSettings] = useState<AppSettings>(loadSettings);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAgent, setShowAgent] = useState(false);
  const [appVersion] = useState('1.0.0');

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  const update = (key: keyof AppSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleDeleteAccount = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="page-transition pb-28">
      <header className="sticky top-0 z-30 glass px-4 py-3">
        <div className="max-w-lg md:max-w-2xl mx-auto flex items-center gap-3">
          <button
            onClick={() => navigate('/profile')}
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <ArrowLeft size={16} className="text-white/60" />
          </button>
          <h1 className="text-lg font-bold text-white">{t('settings.title')}</h1>
        </div>
      </header>

      <div className="max-w-lg md:max-w-2xl mx-auto px-4 mt-6 space-y-6">

        {/* Notifications */}
        <Section title={t('settings.notifications')}>
          <SettingRow
            icon={Bell}
            color="#FF8A00"
            label={t('settings.orderUpdates')}
            sublabel={t('settings.orderUpdatesDesc')}
            right={<Toggle on={settings.notifications_order} onChange={v => update('notifications_order', v)} />}
          />
          <SettingRow
            icon={Bell}
            color="#22C55E"
            label={t('settings.promotions')}
            sublabel={t('settings.promotionsDesc')}
            right={<Toggle on={settings.notifications_promo} onChange={v => update('notifications_promo', v)} />}
          />
          <SettingRow
            icon={Bell}
            color="#00D1FF"
            label={t('settings.systemNotifications')}
            sublabel={t('settings.systemNotificationsDesc')}
            right={<Toggle on={settings.notifications_system} onChange={v => update('notifications_system', v)} />}
          />
        </Section>

        {/* Sound */}
        <Section title={t('settings.soundHaptics')}>
          <SettingRow
            icon={Volume2}
            color="#7B2CFF"
            label={t('settings.soundEffects')}
            sublabel={t('settings.soundEffectsDesc')}
            right={<Toggle on={settings.sound_effects} onChange={v => update('sound_effects', v)} />}
          />
        </Section>

        {/* Language & Region */}
        <Section title={t('settings.languageRegion')}>
          <div className="px-4 py-2">
            <p className="text-sm font-medium text-white/80 mb-3 flex items-center gap-2">
              <Globe size={16} style={{ color: '#00D1FF' }} />
              {t('settings.language')}
            </p>
            <LanguageSwitcher variant="full" />
          </div>
          <SettingRow
            icon={Globe}
            color="#22C55E"
            label={t('settings.currency')}
            sublabel={settings.currency}
            right={<ChevronRight size={14} className="text-white/15 shrink-0" />}
          />
        </Section>

        {/* Privacy */}
        <Section title={t('settings.privacySecurity')}>
          <button
            onClick={() => navigate('/edit-profile')}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all hover:scale-[1.01]"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'rgba(123,44,255,0.1)', border: '1px solid rgba(123,44,255,0.18)' }}>
              <Shield size={16} className="text-mia-purple" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm text-white/80 font-medium">{t('settings.changePassword')}</p>
              <p className="text-[11px] text-white/30 mt-0.5">{t('settings.changePasswordDesc')}</p>
            </div>
            <ChevronRight size={14} className="text-white/15 shrink-0" />
          </button>
        </Section>

        {/* Support */}
        <Section title={t('settings.support')}>
          <button
            onClick={() => setShowAgent(true)}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all hover:scale-[1.01]"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 overflow-hidden"
              style={{ background: 'rgba(255,138,0,0.1)', border: '1px solid rgba(255,138,0,0.18)' }}>
              <img src="/ChatGPT_Image_Jun_26,_2026,_11_55_37_PM.png" alt="MIA Agent" className="w-full h-full object-contain" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm text-white/80 font-medium">{t('settings.miaAgent')}</p>
              <p className="text-[11px] text-white/30 mt-0.5">{t('settings.miaAgentDesc')}</p>
            </div>
            <ChevronRight size={14} className="text-white/15 shrink-0" />
          </button>
          <SettingRow
            icon={Info}
            color="#94A3B8"
            label={t('settings.supportEmail')}
            sublabel={appConfig.support.email}
            right={<ExternalLink size={13} className="text-white/15 shrink-0" />}
          />
        </Section>

        {/* Legal */}
        <Section title={t('settings.legal')}>
          {([
            { labelKey: 'settings.privacyPolicy', path: '/privacy-policy', icon: Shield, color: '#7B2CFF' },
            { labelKey: 'settings.termsConditions', path: '/terms', icon: FileText, color: '#00D1FF' },
            { labelKey: 'settings.refundPolicy', path: '/refund-policy', icon: RotateCcw, color: '#22C55E' },
            { labelKey: 'settings.contactUs', path: '/contact', icon: Phone, color: '#FF8A00' },
          ] as const).map(item => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all hover:scale-[1.01]"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: `${item.color}10`, border: `1px solid ${item.color}18` }}>
                <item.icon size={16} style={{ color: item.color }} />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm text-white/80 font-medium">{t(item.labelKey)}</p>
              </div>
              <ChevronRight size={14} className="text-white/15 shrink-0" />
            </button>
          ))}
        </Section>

        {/* About */}
        <Section title={t('settings.about')}>
          <SettingRow
            icon={Smartphone}
            color="#94A3B8"
            label={t('settings.appVersion')}
            sublabel={`MIA ONE v${appVersion}`}
            right={<span className="text-[11px] text-white/20 font-mono">{appVersion}</span>}
          />
        </Section>

        {/* Danger zone */}
        {user && (
          <Section title={t('settings.account')}>
            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all"
                style={{ background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.08)' }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.12)' }}>
                  <Trash2 size={15} className="text-red-400" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm text-red-400 font-medium">{t('settings.deleteAccount')}</p>
                  <p className="text-[11px] text-white/30 mt-0.5">{t('settings.deleteAccountDesc')}</p>
                </div>
              </button>
            ) : (
              <div className="p-4 rounded-2xl space-y-3" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
                <p className="text-sm text-white/80 font-medium">{t('settings.deleteConfirmTitle')}</p>
                <p className="text-xs text-white/40 leading-relaxed">
                  {t('settings.deleteConfirmDesc')}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white/50"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    {t('settings.cancel')}
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-red-400"
                    style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                    {t('settings.delete')}
                  </button>
                </div>
              </div>
            )}
          </Section>
        )}

        <div className="flex flex-col items-center gap-1 py-4">
          <img src={appConfig.logo} alt="MIA ONE" className="w-8 h-8 object-contain opacity-20" />
          <p className="text-[10px] text-white/15">{appConfig.name} &copy; {new Date().getFullYear()}</p>
        </div>
      </div>

      <MiaAgent isOpen={showAgent} onClose={() => setShowAgent(false)} />
    </div>
  );
}
