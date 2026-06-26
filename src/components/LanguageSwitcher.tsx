import { useState, useRef, useEffect } from 'react';
import { Globe, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { changeLanguage, getCurrentLanguage, AVAILABLE_LANGUAGES } from '../lib/i18n';

interface LanguageSwitcherProps {
  variant?: 'icon' | 'full';
}

export function LanguageSwitcher({ variant = 'icon' }: LanguageSwitcherProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const currentLang = getCurrentLanguage();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (code: string) => {
    changeLanguage(code);
    setOpen(false);
  };

  if (variant === 'icon') {
    return (
      <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen(!open)}
          className="relative w-10 h-10 rounded-2xl flex items-center justify-center glow-hover transition-all"
          style={{
            background: 'linear-gradient(135deg, rgba(255,138,0,0.08), rgba(255,46,201,0.08))',
            border: '1px solid rgba(255,138,0,0.12)',
          }}
          aria-label={t('language.title')}
        >
          <Globe size={18} className="text-white/60" />
          <span className="absolute -bottom-0.5 -right-0.5 text-[8px] font-bold rounded-full w-4 h-4 flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #FF8A00, #FF2EC9)', color: '#fff' }}>
            {currentLang === 'bn' ? 'বাং' : 'EN'}
          </span>
        </button>

        {open && (
          <div
            className="absolute right-0 top-12 z-50 rounded-2xl overflow-hidden page-transition"
            style={{
              background: 'linear-gradient(145deg, rgba(20, 24, 32, 0.98), rgba(13, 17, 23, 0.99))',
              border: '1px solid rgba(255, 138, 0, 0.15)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
              minWidth: '180px',
            }}
          >
            <div className="px-3 py-2 text-[10px] font-semibold text-white/30 uppercase tracking-widest border-b border-white/5">
              {t('language.selectLanguage')}
            </div>
            {AVAILABLE_LANGUAGES.map(lang => (
              <button
                key={lang.code}
                onClick={() => handleSelect(lang.code)}
                className="w-full flex items-center gap-3 px-4 py-3 transition-colors hover:bg-white/5"
                style={{
                  background: currentLang === lang.code ? 'rgba(255,138,0,0.06)' : 'transparent',
                }}
              >
                <span className="text-lg">{lang.flag}</span>
                <span className="text-sm font-medium text-white/80 flex-1 text-left">{lang.label}</span>
                {currentLang === lang.code && (
                  <Check size={14} className="text-mia-orange" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative" ref={ref}>
      {AVAILABLE_LANGUAGES.map(lang => (
        <button
          key={lang.code}
          onClick={() => handleSelect(lang.code)}
          className="menu-glow w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-300 group active:scale-[0.98] mb-3"
          style={{
            border: currentLang === lang.code ? '1px solid rgba(255,138,0,0.3)' : '1px solid rgba(255,255,255,0.05)',
            background: currentLang === lang.code ? 'rgba(255,138,0,0.06)' : 'rgba(255,255,255,0.02)',
          }}
        >
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-300 group-hover:scale-110"
            style={{
              backgroundColor: currentLang === lang.code ? 'rgba(255,138,0,0.12)' : 'rgba(255,255,255,0.04)',
              border: currentLang === lang.code ? '1px solid rgba(255,138,0,0.25)' : '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <span className="text-2xl">{lang.flag}</span>
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-semibold text-white">{lang.label}</p>
            <p className="text-xs text-white/40 mt-0.5">
              {lang.code === 'bn' ? 'বাংলা ভাষা' : 'English Language'}
            </p>
          </div>
          {currentLang === lang.code && (
            <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #FF8A00, #FF2EC9)' }}>
              <Check size={14} className="text-white" />
            </div>
          )}
        </button>
      ))}
    </div>
  );
}
