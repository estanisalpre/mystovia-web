import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import es from './locales/es.json';
import en from './locales/en.json';
import pt from './locales/pt.json';

const resources = {
  es: { translation: es },
  en: { translation: en },
  pt: { translation: pt }
};

// Check if we're in browser environment
const isClient = typeof window !== 'undefined';

// Get initial language from localStorage if available (client-side only)
const getInitialLanguage = (): string => {
  if (isClient) {
    const stored = localStorage.getItem('mystovia-language');
    if (stored && ['es', 'en', 'pt'].includes(stored)) {
      return stored;
    }
  }
  return 'es'; // Default to Spanish for SSR and fallback
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: getInitialLanguage(), // Set initial language explicitly
    fallbackLng: 'es',
    supportedLngs: ['es', 'en', 'pt'],
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;

export const changeLanguage = (lng: string) => {
  i18n.changeLanguage(lng);
  localStorage.setItem('mystovia-language', lng);
  window.dispatchEvent(new CustomEvent('languageChanged', { detail: lng }));
};

export const getCurrentLanguage = () => {
  return i18n.language || localStorage.getItem('mystovia-language') || 'es';
};

export const getTranslation = (key: string): string => {
  return i18n.t(key);
};
