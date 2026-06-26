import { X, ShoppingBag, MapPin, Package, Info, Headphones, ChevronRight } from 'lucide-react';
import { appConfig } from '../lib/config';
import { useTranslation } from 'react-i18next';

interface MiaAgentProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MiaAgent({ isOpen, onClose }: MiaAgentProps) {
  const { t } = useTranslation();

  const quickActions = [
    { icon: ShoppingBag, labelKey: 'miaAgent.placeOrder', color: '#FF8A00' },
    { icon: Package, labelKey: 'miaAgent.trackOrder', color: '#00D1FF' },
    { icon: Info, labelKey: 'miaAgent.productInfo', color: '#7B2CFF' },
    { icon: MapPin, labelKey: 'miaAgent.deliveryInfo', color: '#FF2EC9' },
    { icon: Headphones, labelKey: 'miaAgent.customerSupport', color: '#FF8A00' },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />
      <div
        className="relative w-full max-w-lg mx-auto rounded-t-3xl p-6 page-transition"
        style={{
          background: 'linear-gradient(180deg, rgba(20, 24, 32, 0.98), rgba(13, 17, 23, 0.99))',
          borderTop: '1px solid rgba(255, 138, 0, 0.15)',
          boxShadow: '0 -8px 40px rgba(255, 138, 0, 0.08), inset 0 1px 0 rgba(255,255,255,0.05)',
          paddingBottom: 'max(24px, calc(24px + env(safe-area-inset-bottom, 0px)))',
        }}
      >
        <div className="absolute top-0 left-1/4 right-1/4 h-[2px] rounded-full"
          style={{ background: 'linear-gradient(90deg, transparent, #FF8A00, #FF2EC9, transparent)' }} />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 hover:rotate-90 hover:scale-110"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <X size={14} className="text-white/60" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 rounded-xl rotate-gradient opacity-60 blur-[1px]" />
            <div className="absolute inset-[2px] rounded-xl flex items-center justify-center overflow-hidden"
              style={{ boxShadow: '0 0 12px rgba(255,138,0,0.2)' }}>
              <img src="/ChatGPT_Image_Jun_26,_2026,_11_55_37_PM.png" alt="MIA Agent" className="w-full h-full object-contain" />
            </div>
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">{t('miaAgent.title')}</h3>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 neon-pulse" />
              <span className="text-[11px] text-green-400">{t('miaAgent.online')}</span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl p-4 mb-6"
          style={{
            background: 'linear-gradient(135deg, rgba(255, 138, 0, 0.03), rgba(0, 209, 255, 0.03))',
            border: '1px solid rgba(255, 138, 0, 0.08)',
          }}>
          <p className="text-sm text-white/80 leading-relaxed whitespace-pre-line">
            {appConfig.support.welcomeMessage}
          </p>
        </div>

        <div className="space-y-2">
          {quickActions.map((action) => {
            const Icon = action.icon;
            const label = t(action.labelKey);
            return (
              <button
                key={action.labelKey}
                onClick={() => {
                  if (action.labelKey === 'miaAgent.customerSupport') {
                    window.open(appConfig.support.whatsappUrl, '_blank');
                  }
                  onClose();
                }}
                className="menu-glow w-full flex items-center gap-3 p-3.5 rounded-xl transition-all duration-300 hover:translate-x-1"
                style={{ border: '1px solid rgba(255,255,255,0.03)' }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300"
                  style={{
                    backgroundColor: `${action.color}12`,
                    border: `1px solid ${action.color}20`,
                  }}
                >
                  <Icon size={18} style={{ color: action.color }} />
                </div>
                <span className="text-sm text-white/80 flex-1 text-left">{label}</span>
                <ChevronRight size={14} style={{ color: `${action.color}60` }} />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
