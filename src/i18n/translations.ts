import es from './locales/es.json';
import en from './locales/en.json';
import pt from './locales/pt.json';

type TranslationFile = typeof es;

const translations: Record<string, TranslationFile> = {
  es,
  en,
  pt
};

export function getNestedValue(obj: any, path: string): string {
  const keys = path.split('.');
  let current = obj;

  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      return path;
    }
  }

  return typeof current === 'string' ? current : path;
}

export function t(key: string, lang: string = 'es'): string {
  const translation = translations[lang] || translations.es;
  return getNestedValue(translation, key);
}

export function getStoredLanguage(): string {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('mystovia-language') || 'es';
  }
  return 'es';
}

export { translations };
