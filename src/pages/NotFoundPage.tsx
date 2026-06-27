import { Home, Search, ArrowLeft } from 'lucide-react';
import { useNavigate } from '../lib/router';
import { useTranslation } from 'react-i18next';

export function NotFoundPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 pb-24 text-center" style={{ background: "var(--bg-base)" }}>
      {/* Ambient glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-[0.05] blur-3xl"
          style={{ background: 'radial-gradient(circle, #FF8A00, transparent)' }} />
        <div className="absolute bottom-1/3 right-1/4 w-72 h-72 rounded-full opacity-[0.04] blur-3xl"
          style={{ background: 'radial-gradient(circle, #7B2CFF, transparent)' }} />
      </div>

      <div className="relative z-10 max-w-sm">
        {/* 404 number */}
        <div
          className="text-[96px] sm:text-[120px] font-black leading-none mb-2 select-none"
          style={{
            background: 'linear-gradient(135deg, #FF8A00 0%, #FF2EC9 50%, #7B2CFF 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            filter: 'drop-shadow(0 0 40px rgba(255,138,0,0.2))',
          }}
          aria-label="404"
        >
          404
        </div>

        <h1 className="text-xl font-bold text-white mb-3">{t('notFound.title')}</h1>
        <p className="text-sm text-white/40 mb-10 leading-relaxed">
          {t('notFound.desc')}<br />
          {t('notFound.subDesc')}
        </p>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <button
            onClick={() => navigate('/')}
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl text-sm font-semibold text-white"
            style={{ background: 'linear-gradient(135deg, #FF8A00, #FF2EC9)', boxShadow: '0 4px 20px rgba(255,138,0,0.3)' }}
          >
            <Home size={16} />
            {t('notFound.backHome')}
          </button>
          <button
            onClick={() => navigate('/search')}
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl text-sm font-medium text-white/60"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-normal)' }}
          >
            <Search size={16} />
            {t('notFound.searchProducts')}
          </button>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center gap-2 w-full py-3 text-sm text-white/30 hover:text-white/60 transition-colors"
          >
            <ArrowLeft size={14} />
            {t('notFound.goBack')}
          </button>
        </div>
      </div>
    </div>
  );
}
