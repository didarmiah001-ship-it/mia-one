import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import bn from '../locales/bn.json';
import en from '../locales/en.json';

const STORAGE_KEY = 'mia-one-lang';

function getInitialLanguage(): string {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'bn' || saved === 'en') return saved;
  } catch {
    // localStorage not available
  }
  return 'bn'; // Default: বাংলা
}

i18n.use(initReactI18next).init({
  resources: {
    bn: { translation: bn },
    en: { translation: en },
  },
  lng: getInitialLanguage(),
  fallbackLng: 'bn',
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
});

export function changeLanguage(lng: string) {
  i18n.changeLanguage(lng);
  try {
    localStorage.setItem(STORAGE_KEY, lng);
  } catch {
    // ignore
  }
}

export function getCurrentLanguage(): string {
  return i18n.language;
}

export const AVAILABLE_LANGUAGES = [
  { code: 'bn', label: 'বাংলা', flag: '🇧🇩' },
  { code: 'en', label: 'English', flag: '🇺🇸' },
];

export default i18n;
