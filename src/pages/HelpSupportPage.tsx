import { useState } from 'react';
import {
  ArrowLeft, MessageCircle, Phone, Mail, Headphones, ChevronDown,
  ShoppingBag, Package, XCircle, CreditCard, Truck, HelpCircle,
} from 'lucide-react';
import { useNavigate } from '../lib/router';
import { MiaAgent } from '../components/MiaAgent';
import { useTranslation } from 'react-i18next';

const WHATSAPP_NUMBER = '8801823057578';
const PHONE_NUMBER = '+8801823057578';
const EMAIL = 'miaonebd@gmail.com';
const WHATSAPP_MESSAGE = 'Hello MIA ONE, I need help with my order.';

const faqs = [
  {
    icon: ShoppingBag,
    color: '#FF8A00',
    questionKey: 'helpSupport.faq1Q',
    answerKey: 'helpSupport.faq1A',
  },
  {
    icon: Package,
    color: '#00D1FF',
    questionKey: 'helpSupport.faq2Q',
    answerKey: 'helpSupport.faq2A',
  },
  {
    icon: XCircle,
    color: '#FF2EC9',
    questionKey: 'helpSupport.faq3Q',
    answerKey: 'helpSupport.faq3A',
  },
  {
    icon: CreditCard,
    color: '#7B2CFF',
    questionKey: 'helpSupport.faq4Q',
    answerKey: 'helpSupport.faq4A',
  },
  {
    icon: Truck,
    color: '#22C55E',
    questionKey: 'helpSupport.faq5Q',
    answerKey: 'helpSupport.faq5A',
  },
];

export function HelpSupportPage() {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [showAgent, setShowAgent] = useState(false);
  const { t } = useTranslation();

  const handleWhatsApp = () => {
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;
    window.open(url, '_blank');
  };

  const handleCall = () => {
    window.location.href = `tel:${PHONE_NUMBER}`;
  };

  const handleEmail = () => {
    window.location.href = `mailto:${EMAIL}`;
  };

  const contactButtons = [
    {
      icon: MessageCircle,
      labelKey: 'helpSupport.whatsappHelpline',
      subtitleKey: 'helpSupport.whatsappDesc',
      color: '#25D366',
      bg: 'rgba(37, 211, 102, 0.08)',
      border: 'rgba(37, 211, 102, 0.2)',
      onClick: handleWhatsApp,
    },
    {
      icon: Phone,
      labelKey: 'helpSupport.callHelpline',
      subtitle: PHONE_NUMBER,
      color: '#00D1FF',
      bg: 'rgba(0, 209, 255, 0.08)',
      border: 'rgba(0, 209, 255, 0.2)',
      onClick: handleCall,
    },
    {
      icon: Mail,
      labelKey: 'helpSupport.emailSupport',
      subtitle: EMAIL,
      color: '#FF8A00',
      bg: 'rgba(255, 138, 0, 0.08)',
      border: 'rgba(255, 138, 0, 0.2)',
      onClick: handleEmail,
    },
    {
      icon: Headphones,
      labelKey: 'helpSupport.miaAgent',
      subtitleKey: 'helpSupport.miaAgentDesc',
      color: '#FF2EC9',
      bg: 'rgba(255, 46, 201, 0.08)',
      border: 'rgba(255, 46, 201, 0.2)',
      onClick: () => setShowAgent(true),
    },
  ];

  return (
    <div className="page-transition pb-28 min-h-screen">
      <header className="sticky top-0 z-30 glass px-4 py-3">
        <div className="max-w-lg md:max-w-2xl mx-auto flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center transition-colors hover:bg-white/10"
          >
            <ArrowLeft size={18} className="text-white/70" />
          </button>
          <h1 className="text-lg font-bold text-white">{t('helpSupport.title')}</h1>
        </div>
      </header>

      <div className="max-w-lg md:max-w-2xl mx-auto px-4 mt-4 space-y-6">
        {/* Hero */}
        <div className="glow-card p-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
            <div className="absolute top-[-20px] left-[10%] w-40 h-40 rounded-full opacity-[0.06] blur-3xl"
              style={{ background: 'radial-gradient(circle, #FF8A00, transparent)' }} />
            <div className="absolute bottom-[-10px] right-[10%] w-32 h-32 rounded-full opacity-[0.06] blur-3xl"
              style={{ background: 'radial-gradient(circle, #FF2EC9, transparent)' }} />
          </div>
          <div className="relative flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
              style={{ background: 'linear-gradient(135deg, rgba(255,138,0,0.12), rgba(255,46,201,0.08))', border: '1px solid rgba(255,138,0,0.2)' }}>
              <Headphones size={24} className="text-mia-orange" />
            </div>
            <h2 className="text-base font-bold text-white">{t('helpSupport.hero')}</h2>
            <p className="text-xs text-white/40 mt-1.5 leading-relaxed">
              {t('helpSupport.heroDesc')}
            </p>
          </div>
        </div>

        {/* Contact Buttons */}
        <div>
          <p className="text-[10px] font-semibold text-white/25 uppercase tracking-widest mb-3 px-1">
            {t('helpSupport.contactChannels')}
          </p>
          <div className="space-y-3">
            {contactButtons.map((btn, idx) => {
              const Icon = btn.icon;
              return (
                <button
                  key={idx}
                  onClick={btn.onClick}
                  className="menu-glow w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-300 group active:scale-[0.98]"
                  style={{ border: `1px solid ${btn.border}`, background: btn.bg }}
                >
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-300 group-hover:scale-110"
                    style={{ backgroundColor: `${btn.color}15`, border: `1px solid ${btn.color}30` }}
                  >
                    <Icon size={22} style={{ color: btn.color }} />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-semibold text-white">{btn.labelKey ? t(btn.labelKey) : btn.subtitle}</p>
                    <p className="text-xs text-white/40 mt-0.5 truncate">{btn.subtitleKey ? t(btn.subtitleKey) : btn.subtitle}</p>
                  </div>
                  <ChevronDown size={16} className="text-white/20 -rotate-90 shrink-0" />
                </button>
              );
            })}
          </div>
        </div>

        {/* FAQ */}
        <div>
          <div className="flex items-center gap-2 mb-3 px-1">
            <HelpCircle size={14} className="text-mia-orange" />
            <p className="text-[10px] font-semibold text-white/25 uppercase tracking-widest">
              {t('helpSupport.faq')}
            </p>
          </div>
          <div className="space-y-2.5">
            {faqs.map((faq, idx) => {
              const Icon = faq.icon;
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="glow-card overflow-hidden transition-all duration-300"
                  style={{ border: isOpen ? `1px solid ${faq.color}30` : '1px solid rgba(255,255,255,0.03)' }}
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
                  >
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300"
                      style={{
                        backgroundColor: `${faq.color}10`,
                        border: `1px solid ${faq.color}18`,
                      }}
                    >
                      <Icon size={16} style={{ color: faq.color }} />
                    </div>
                    <span className="text-sm font-medium text-white/80 flex-1">{t(faq.questionKey)}</span>
                    <ChevronDown
                      size={16}
                      className="text-white/30 shrink-0 transition-transform duration-300"
                      style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                    />
                  </button>
                  <div
                    className="overflow-hidden transition-all duration-300"
                    style={{
                      maxHeight: isOpen ? '300px' : '0px',
                      opacity: isOpen ? 1 : 0,
                    }}
                  >
                    <p className="text-xs text-white/50 leading-relaxed px-4 pb-4 pt-0"
                      style={{ paddingLeft: '60px' }}>
                      {t(faq.answerKey)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer note */}
        <div className="flex flex-col items-center gap-1 py-4">
          <p className="text-[10px] text-white/20">{t('helpSupport.footer')}</p>
          <p className="text-[10px] text-white/15">{t('helpSupport.hours')}</p>
        </div>
      </div>

      <MiaAgent isOpen={showAgent} onClose={() => setShowAgent(false)} />
    </div>
  );
}
