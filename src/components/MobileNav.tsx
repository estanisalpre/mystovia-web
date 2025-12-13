import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Store, Menu, X } from 'lucide-react';
import CartButton from './CartButton';
import HeaderAuth from './HeaderAuth';
import '../i18n';

export default function MobileNav() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
    document.body.style.overflow = !isOpen ? 'hidden' : '';
  };

  const closeMenu = () => {
    setIsOpen(false);
    document.body.style.overflow = '';
  };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) closeMenu();
    };

    const handleResize = () => {
      if (window.innerWidth >= 1024 && isOpen) closeMenu();
    };

    document.addEventListener('keydown', handleEscape);
    window.addEventListener('resize', handleResize);

    return () => {
      document.removeEventListener('keydown', handleEscape);
      window.removeEventListener('resize', handleResize);
    };
  }, [isOpen]);

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={toggleMenu}
        className="lg:hidden p-2 text-white hover:text-yellow-500 transition"
        aria-label="Abrir menu"
      >
        {isOpen ? <X size={28} /> : <Menu size={28} />}
      </button>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-90 bg-black/95 backdrop-blur-md lg:hidden">
          <div className="flex flex-col h-full pt-20 pb-8 px-6 overflow-y-auto">
            {/* Mobile Auth (at top) */}
            <div className="flex items-center justify-center gap-4 mb-8 md:hidden">
              <CartButton />
              <HeaderAuth />
            </div>

            {/* Mobile Navigation Links */}
            <nav className="flex flex-col items-center gap-4 medieval-font font-semibold text-lg">
              <a
                href="/marketplace"
                onClick={closeMenu}
                className="flex items-center gap-2 text-yellow-500 border border-yellow-500/50 px-6 py-3 rounded-lg hover:bg-yellow-500/10 transition"
              >
                <Store size={20} /> {t('nav.store')}
              </a>
              <a href="/news" onClick={closeMenu} className="text-white hover:text-yellow-500 transition py-2 px-4">
                {t('nav.news')}
              </a>
              <a href="/forum" onClick={closeMenu} className="text-white hover:text-yellow-500 transition py-2 px-4">
                {t('nav.forum')}
              </a>
              <a href="/wiki" onClick={closeMenu} className="text-white hover:text-yellow-500 transition py-2 px-4">
                {t('nav.wiki')}
              </a>
              <a href="/downloads" onClick={closeMenu} className="text-white hover:text-yellow-500 transition py-2 px-4">
                {t('nav.downloads')}
              </a>
              <a href="/rules" onClick={closeMenu} className="text-white hover:text-yellow-500 transition py-2 px-4">
                {t('nav.rules')}
              </a>
              <a href="/faqs" onClick={closeMenu} className="text-white hover:text-yellow-500 transition py-2 px-4">
                {t('nav.faqs')}
              </a>
              <a href="/support" onClick={closeMenu} className="text-white hover:text-yellow-500 transition py-2 px-4">
                {t('nav.support')}
              </a>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
