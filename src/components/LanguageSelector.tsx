import { useState, useEffect } from 'react';
import { Globe } from 'lucide-react';
import { changeLanguage, getCurrentLanguage } from '../i18n';

const languages = [
  { code: 'es', label: 'ES', name: 'Español' },
  { code: 'en', label: 'EN', name: 'English' },
  { code: 'pt', label: 'PT', name: 'Português' }
];

export default function LanguageSelector() {
  const [currentLang, setCurrentLang] = useState('es');
  const [isOpen, setIsOpen] = useState(false);
  const [isHiddenByCart, setIsHiddenByCart] = useState(false);

  useEffect(() => {
    setCurrentLang(getCurrentLanguage());
  }, []);

  // Listen for cart sidebar toggle event to hide on mobile
  useEffect(() => {
    const handleCartToggle = (e: CustomEvent<{ isOpen: boolean }>) => {
      // Only hide on mobile (< 1024px)
      if (window.innerWidth < 1024) {
        setIsHiddenByCart(e.detail.isOpen);
      }
    };

    window.addEventListener('cart-sidebar-toggle', handleCartToggle as EventListener);
    return () => window.removeEventListener('cart-sidebar-toggle', handleCartToggle as EventListener);
  }, []);

  const handleLanguageChange = (langCode: string) => {
    changeLanguage(langCode);
    setCurrentLang(langCode);
    setIsOpen(false);
    window.location.reload();
  };

  const currentLanguage = languages.find(l => l.code === currentLang) || languages[0];

  // Hide when cart is open on mobile
  if (isHiddenByCart) {
    return null;
  }

  return (
    <aside
      className="fixed bottom-18 right-4 z-[900] group flex items-center gap-2 bg-black/40 border border-yellow-500 rounded-lg p-3 cursor-pointer backdrop-blur-md transition-all"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <Globe className="text-yellow-400 w-6 h-6 group-hover:text-yellow-300 transition" />
      <span className="text-yellow-400 text-sm font-bold group-hover:text-yellow-300">
        {currentLanguage.label}
      </span>

      {/* Language dropdown */}
      <div
        className={`absolute bottom-full right-0 mb-2 bg-black/90 border border-yellow-500/50 rounded-lg overflow-hidden transition-all duration-300 ${
          isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`}
      >
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className={`w-full px-4 py-2 text-left text-sm transition hover:bg-yellow-500/20 flex items-center gap-2 ${
              currentLang === lang.code
                ? 'text-yellow-400 bg-yellow-500/10'
                : 'text-white'
            }`}
          >
            <span className="font-bold w-6">{lang.label}</span>
            <span>{lang.name}</span>
          </button>
        ))}
      </div>
    </aside>
  );
}
