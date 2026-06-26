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

export function PrivacyPolicyPage() {
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
          <h1 className="text-lg font-bold text-white">{t('privacy.title')}</h1>
        </div>
      </header>

      <div className="max-w-lg md:max-w-2xl mx-auto px-4 mt-6 space-y-6">
        <div className="glow-card p-4">
          <p className="text-[11px] text-white/30">{t('privacy.lastUpdated')} {LAST_UPDATED}</p>
          <p className="text-xs text-white/50 mt-2 leading-relaxed">
            {appConfig.name} ("we", "us", "our") respects your privacy and is committed to protecting your personal data.
            This Privacy Policy explains how we collect, use, store, and share information about you when you use our app.
          </p>
        </div>

        <div className="space-y-5">
          <Section title={t('privacy.section1')}>
            <p><strong className="text-white/70">{t('privacy.section1Account')}</strong> {t('privacy.section1AccountDesc')}</p>
            <p><strong className="text-white/70">{t('privacy.section1Order')}</strong> {t('privacy.section1OrderDesc')}</p>
            <p><strong className="text-white/70">{t('privacy.section1Device')}</strong> {t('privacy.section1DeviceDesc')}</p>
            <p><strong className="text-white/70">{t('privacy.section1Location')}</strong> {t('privacy.section1LocationDesc')}</p>
          </Section>

          <Section title={t('privacy.section2')}>
            <p>{t('privacy.section2_1')}</p>
            <p>{t('privacy.section2_2')}</p>
            <p>{t('privacy.section2_3')}</p>
            <p>{t('privacy.section2_4')}</p>
            <p>{t('privacy.section2_5')}</p>
          </Section>

          <Section title={t('privacy.section3')}>
            <p>{t('privacy.section3Desc')}</p>
            <p>{t('privacy.section3_1')}</p>
            <p>{t('privacy.section3_2')}</p>
            <p>{t('privacy.section3_3')}</p>
            <p>{t('privacy.section3_4')}</p>
          </Section>

          <Section title={t('privacy.section4')}>
            <p>{t('privacy.section4Desc')}</p>
          </Section>

          <Section title={t('privacy.section5')}>
            <p>{t('privacy.section5Desc')}</p>
          </Section>

          <Section title={t('privacy.section6')}>
            <p>{t('privacy.section6Desc')}</p>
          </Section>

          <Section title={t('privacy.section7')}>
            <p>{t('privacy.section7Desc')}</p>
          </Section>

          <Section title={t('privacy.section8')}>
            <p>{t('privacy.section8Desc')}</p>
          </Section>

          <Section title={t('privacy.section9')}>
            <p>{t('privacy.section9Desc')}</p>
          </Section>

          <Section title={t('privacy.section10')}>
            <p>{t('privacy.section10Desc')}</p>
            <p className="text-white/70">{appConfig.support.email}</p>
          </Section>
        </div>
      </div>
    </div>
  );
}
