import { ArrowLeft, CheckCircle, XCircle, AlertCircle, MessageCircle } from 'lucide-react';
import { useNavigate } from '../lib/router';
import { useTranslation } from 'react-i18next';
import { appConfig } from '../lib/config';

const LAST_UPDATED = 'June 26, 2026';

export function RefundPolicyPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const summaryCards = [
    { icon: CheckCircle, color: '#22C55E', label: t('refund.sevenDayReturns') },
    { icon: AlertCircle, color: '#FF8A00', label: t('refund.originalCondition') },
    { icon: CheckCircle, color: '#00D1FF', label: t('refund.fastRefunds') },
  ];

  const returnableItems = [
    { ok: true, text: t('refund.returnable1') },
    { ok: true, text: t('refund.returnable2') },
    { ok: true, text: t('refund.returnable3') },
    { ok: true, text: t('refund.returnable4') },
    { ok: false, text: t('refund.notReturnable1') },
    { ok: false, text: t('refund.notReturnable2') },
    { ok: false, text: t('refund.notReturnable3') },
    { ok: false, text: t('refund.notReturnable4') },
  ];

  const steps = [
    { step: '01', title: t('refund.step1Title'), desc: t('refund.step1Desc') },
    { step: '02', title: t('refund.step2Title'), desc: t('refund.step2Desc') },
    { step: '03', title: t('refund.step3Title'), desc: t('refund.step3Desc') },
    { step: '04', title: t('refund.step4Title'), desc: t('refund.step4Desc') },
  ];

  return (
    <div className="page-transition pb-28">
      <header className="sticky top-0 z-30 glass px-4 py-3">
        <div className="max-w-lg md:max-w-2xl mx-auto flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            aria-label={t('common.back')}
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <ArrowLeft size={16} className="text-white/60" />
          </button>
          <h1 className="text-lg font-bold text-white">{t('refund.title')}</h1>
        </div>
      </header>

      <div className="max-w-lg md:max-w-2xl mx-auto px-4 mt-6 space-y-6">
        <div className="glow-card p-4">
          <p className="text-[11px] text-white/30">{t('refund.lastUpdated')} {LAST_UPDATED}</p>
          <p className="text-xs text-white/50 mt-2 leading-relaxed">{t('refund.intro')}</p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {summaryCards.map(item => (
            <div key={item.label} className="glow-card p-3 text-center">
              <item.icon size={20} style={{ color: item.color }} className="mx-auto mb-2" />
              <p className="text-[11px] text-white/60 font-medium leading-tight">{item.label}</p>
            </div>
          ))}
        </div>

        <div className="space-y-5">
          <div>
            <h2 className="text-sm font-bold text-white mb-3">{t('refund.whatCanBeReturned')}</h2>
            <div className="space-y-2">
              {returnableItems.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl"
                  style={{ background: item.ok ? 'rgba(34,197,94,0.04)' : 'rgba(239,68,68,0.04)', border: `1px solid ${item.ok ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)'}` }}>
                  {item.ok
                    ? <CheckCircle size={14} className="text-green-400 shrink-0 mt-0.5" />
                    : <XCircle size={14} className="text-red-400 shrink-0 mt-0.5" />}
                  <span className="text-xs text-white/60 leading-relaxed">{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-sm font-bold text-white mb-3">{t('refund.returnProcess')}</h2>
            <div className="space-y-3">
              {steps.map(item => (
                <div key={item.step} className="flex gap-3 px-4 py-3 rounded-2xl"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <span className="text-lg font-black leading-none shrink-0"
                    style={{ background: 'linear-gradient(135deg, #FF8A00, #FF2EC9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                    {item.step}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-white/80 mb-0.5">{item.title}</p>
                    <p className="text-xs text-white/40 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-sm font-bold text-white mb-2">{t('refund.refundTimeline')}</h2>
            <div className="space-y-2 text-xs text-white/50 leading-relaxed">
              <p>• {t('refund.timeline1')}</p>
              <p>• {t('refund.timeline2')}</p>
              <p>• {t('refund.timeline3')}</p>
            </div>
          </div>

          <div>
            <h2 className="text-sm font-bold text-white mb-2">{t('refund.orderCancellation')}</h2>
            <div className="text-xs text-white/50 leading-relaxed space-y-2">
              <p>{t('refund.cancellationDesc')}</p>
              <p>{t('refund.cancellationHowTo')}</p>
            </div>
          </div>

          <a
            href={appConfig.support.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl text-sm font-semibold text-white"
            style={{ background: 'linear-gradient(135deg, rgba(37,211,102,0.15), rgba(37,211,102,0.08))', border: '1px solid rgba(37,211,102,0.2)' }}
          >
            <MessageCircle size={15} style={{ color: '#25D366' }} />
            <span style={{ color: '#25D366' }}>{t('refund.startReturn')}</span>
          </a>
        </div>
      </div>
    </div>
  );
}
