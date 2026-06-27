import { useState, useEffect } from 'react';
import { appConfig } from '../lib/config';
import { useTranslation } from 'react-i18next';

export function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const { t } = useTranslation();
  const [progress, setProgress] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setFadeOut(true);
          setTimeout(onComplete, 500);
          return 100;
        }
        return prev + 3;
      });
    }, 40);
    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center transition-all duration-500 ${fadeOut ? 'opacity-0 scale-105' : 'opacity-100 scale-100'}`}
      style={{ background: 'var(--bg-base)' }}>
      {/* Ambient background glow */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full opacity-[0.06] blur-3xl"
          style={{ background: 'radial-gradient(circle, #FF8A00, transparent)', animation: 'breathe-neon 4s ease-in-out infinite' }} />
        <div className="absolute bottom-1/3 right-1/4 w-48 h-48 rounded-full opacity-[0.06] blur-3xl"
          style={{ background: 'radial-gradient(circle, #FF2EC9, transparent)', animation: 'breathe-neon 5s ease-in-out infinite reverse' }} />
        <div className="absolute top-1/3 right-1/3 w-40 h-40 rounded-full opacity-[0.04] blur-3xl"
          style={{ background: 'radial-gradient(circle, #00D1FF, transparent)', animation: 'breathe-neon 6s ease-in-out infinite' }} />
      </div>

      {/* Logo with rotating glow ring */}
      <div className="relative mb-8">
        {/* Outer glow ring - animated */}
        <div className="absolute inset-[-16px] rounded-3xl opacity-50 blur-xl"
          style={{
            background: 'conic-gradient(from 0deg, #FF8A00, #FF2EC9, #7B2CFF, #00D1FF, #FF8A00)',
            animation: 'rotate-glow 3s linear infinite',
          }}
        />
        {/* Mid glow ring */}
        <div className="absolute inset-[-8px] rounded-3xl opacity-40 blur-md rotate-gradient" />
        {/* Logo container */}
        <div className="relative w-32 h-32 flex items-center justify-center">
          <img
            src={appConfig.logo}
            alt="MIA ONE"
            className="w-full h-full object-contain"
          />
        </div>
      </div>

      {/* Brand text */}
      <h1 className="text-2xl font-extrabold neon-text mb-2">MIA ONE</h1>
      <p className="text-xs text-white/40 mb-8 tracking-[0.25em] uppercase font-medium">{appConfig.slogan}</p>

      {/* Progress bar */}
      <div className="w-52 h-1 bg-white/5 rounded-full overflow-hidden relative">
        <div className="absolute inset-0 shimmer" />
        <div
          className="h-full rounded-full transition-all duration-75 relative"
          style={{
            width: `${progress}%`,
            background: `linear-gradient(90deg, ${appConfig.colors.orange}, ${appConfig.colors.pink}, ${appConfig.colors.purple}, ${appConfig.colors.blue})`,
            boxShadow: `0 0 12px ${appConfig.colors.orange}40`,
          }}
        />
      </div>

      {/* Progress text */}
      <p className="text-[10px] text-white/20 mt-4 font-medium tracking-wider">{t('splash.loading')}</p>
    </div>
  );
}
