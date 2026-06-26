import { ArrowLeft } from 'lucide-react';
import { useNavigate } from '../lib/router';
import { useTranslation } from 'react-i18next';
import { appConfig } from '../lib/config';

const LAST_UPDATED = 'June 26, 2026';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-sm font-bold text-white mb-2">{title}</h2>
      <div className="text-xs text-white/50 leading-relaxed space-y-2">{children}</div>
    </div>
  );
}

export function TermsPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

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
          <h1 className="text-lg font-bold text-white">{t('terms.title')}</h1>
        </div>
      </header>

      <div className="max-w-lg md:max-w-2xl mx-auto px-4 mt-6 space-y-6">
        <div className="glow-card p-4">
          <p className="text-[11px] text-white/30">{t('terms.lastUpdated')} {LAST_UPDATED}</p>
          <p className="text-xs text-white/50 mt-2 leading-relaxed">
            {appConfig.name}
          </p>
        </div>

        <div className="space-y-5">
          <Section title={t('terms.section1')}>
            <p>{appConfig.name}</p>
          </Section>

          <Section title={t('terms.section2')}>
            <p>{t('terms.section2Desc')}</p>
          </Section>

          <Section title={t('terms.section3')}>
            <p>{t('terms.section3Desc')}</p>
            <p>{t('terms.section3Payment')}</p>
          </Section>

          <Section title={t('terms.section4')}>
            <p>{t('terms.section4Delivery')} {appConfig.delivery.estimatedDays}. {t('terms.section4Estimate')} {appConfig.delivery.currency}{appConfig.delivery.freeDeliveryThreshold}.</p>
          </Section>

          <Section title={t('terms.section5')}>
            <p>{t('terms.section5Desc')}</p>
          </Section>

          <Section title={t('terms.section6')}>
            <p>{t('terms.section6Desc')}</p>
          </Section>

          <Section title={t('terms.section7')}>
            <p>{t('terms.section7Desc')} {appConfig.name}, {t('terms.section7Desc2')}</p>
          </Section>

          <Section title={t('terms.section8')}>
            <p>{appConfig.name} {t('terms.section8Desc')}</p>
          </Section>

          <Section title={t('terms.section9')}>
            <p>{t('terms.section9Desc')}</p>
          </Section>

          <Section title={t('terms.section10')}>
            <p>{t('terms.section10Desc')}</p>
          </Section>

          <Section title={t('terms.section11')}>
            <p>{t('terms.section11Desc')}</p>
            <p className="text-white/70">{appConfig.support.email}</p>
          </Section>
        </div>
      </div>
    </div>
  );
}
