import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import es from './locales/es.json';
import en from './locales/en.json';
import pt from './locales/pt.json';

const resources = {
  es: { translation: es },
  en: { translation: en },
  pt: { translation: pt }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'es',
    supportedLngs: ['es', 'en', 'pt'],
    interpolation: {
      escapeValue: false
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'mystovia-language'
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
