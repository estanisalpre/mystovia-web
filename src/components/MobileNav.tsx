import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Store, Menu, X, Gamepad2, Users, HelpCircle } from 'lucide-react';
import HeaderAuth from './HeaderAuth';
import '../i18n';
import { openDownloadModal } from './DownloadModal';

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
        style={{ position: 'relative', zIndex: 1000 }}
        aria-label="Abrir menu"
      >
        {isOpen ? <X size={28} /> : <Menu size={28} />}
      </button>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div
          className="lg:hidden"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            zIndex: 950,
            background: 'linear-gradient(to bottom, rgb(17 24 39), rgb(17 24 39), rgb(0 0 0))'
          }}
        >
          {/* Diamond pattern overlay */}
          <div
            className="absolute inset-0 opacity-5 pointer-events-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0L60 30L30 60L0 30z' fill='%23d4af37' fill-opacity='0.4'/%3E%3C/svg%3E")`,
              backgroundSize: '30px 30px'
            }}
          />

          {/* Decorative top border */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent" />

          {/* Decorative corner ornaments */}
          <div className="absolute bottom-4 left-4 w-20 h-20 opacity-10 pointer-events-none">
            <svg viewBox="0 0 100 100" fill="none" className="w-full h-full text-yellow-500">
              <path d="M0 100 L0 60 Q0 0 60 0 L100 0 L100 10 L60 10 Q10 10 10 60 L10 100 Z" fill="currentColor"/>
            </svg>
          </div>
          <div className="absolute bottom-4 right-4 w-20 h-20 opacity-10 pointer-events-none" style={{ transform: 'scaleX(-1)' }}>
            <svg viewBox="0 0 100 100" fill="none" className="w-full h-full text-yellow-500">
              <path d="M0 100 L0 60 Q0 0 60 0 L100 0 L100 10 L60 10 Q10 10 10 60 L10 100 Z" fill="currentColor"/>
            </svg>
          </div>

          {/* Scrollable Content */}
          <div className="relative z-10 w-full h-full overflow-y-auto pt-16 pb-8 px-6">
            {/* Mobile Auth (at top) */}
            <div className="flex items-center justify-center gap-4 mb-6">
              <HeaderAuth />
            </div>

            {/* Decorative divider */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent" />
              <div className="flex items-center gap-1 text-yellow-600/40">
                <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                </svg>
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                </svg>
                <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                </svg>
              </div>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent" />
            </div>

            {/* Store button - Featured */}
            <a
              href="/marketplace"
              onClick={closeMenu}
              className="flex items-center justify-center gap-3 text-yellow-500 border border-yellow-500/50 px-6 py-4 rounded-xl hover:bg-yellow-500/10 transition-all duration-300 mb-6 font-semibold text-lg bg-yellow-500/5"
              style={{ fontFamily: '"Cinzel", serif' }}
            >
              <Store size={22} /> {t('nav.store')}
            </a>

            {/* Navigation Sections */}
            <nav className="flex flex-col gap-5">
              {/* Game Section */}
              <div>
                <h3 className="text-yellow-500/70 text-xs uppercase tracking-wider mb-2 flex items-center gap-2 px-2">
                  <Gamepad2 size={14} />
                  <span>{t('nav.game') || 'Juego'}</span>
                </h3>
                <div className="space-y-1">
                  <button
                    onClick={() => {
                      closeMenu();
                      openDownloadModal();
                    }}
                    className="flex items-center gap-3 text-gray-300 hover:text-yellow-500 transition-colors py-3 px-4 rounded-lg hover:bg-white/5 group w-full text-left"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-600 group-hover:bg-yellow-500 transition-colors" />
                    {t('nav.downloads')}
                  </button>
                  <a
                    href="/wiki"
                    onClick={closeMenu}
                    className="flex items-center gap-3 text-gray-300 hover:text-yellow-500 transition-colors py-3 px-4 rounded-lg hover:bg-white/5 group"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-600 group-hover:bg-yellow-500 transition-colors" />
                    {t('nav.wiki')}
                  </a>
                  <a
                    href="/highscores"
                    onClick={closeMenu}
                    className="flex items-center gap-3 text-gray-300 hover:text-yellow-500 transition-colors py-3 px-4 rounded-lg hover:bg-white/5 group"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-600 group-hover:bg-yellow-500 transition-colors" />
                    {t('nav.highscores')}
                  </a>
                  <a
                    href="/latest-deaths"
                    onClick={closeMenu}
                    className="flex items-center gap-3 text-gray-300 hover:text-yellow-500 transition-colors py-3 px-4 rounded-lg hover:bg-white/5 group"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-600 group-hover:bg-yellow-500 transition-colors" />
                    {t('nav.latestDeaths')}
                  </a>
                </div>
              </div>

              {/* Community Section */}
              <div>
                <h3 className="text-yellow-500/70 text-xs uppercase tracking-wider mb-2 flex items-center gap-2 px-2">
                  <Users size={14} />
                  <span>{t('nav.community') || 'Comunidad'}</span>
                </h3>
                <div className="space-y-1">
                  <a
                    href="/news"
                    onClick={closeMenu}
                    className="flex items-center gap-3 text-gray-300 hover:text-yellow-500 transition-colors py-3 px-4 rounded-lg hover:bg-white/5 group"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-600 group-hover:bg-yellow-500 transition-colors" />
                    {t('nav.news')}
                  </a>
                  <a
                    href="/forum"
                    onClick={closeMenu}
                    className="flex items-center gap-3 text-gray-300 hover:text-yellow-500 transition-colors py-3 px-4 rounded-lg hover:bg-white/5 group"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-600 group-hover:bg-yellow-500 transition-colors" />
                    {t('nav.forum')}
                  </a>
                  <a
                    href="/guilds"
                    onClick={closeMenu}
                    className="flex items-center gap-3 text-gray-300 hover:text-yellow-500 transition-colors py-3 px-4 rounded-lg hover:bg-white/5 group"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-600 group-hover:bg-yellow-500 transition-colors" />
                    {t('nav.guilds')}
                  </a>
                </div>
              </div>

              {/* Support Section */}
              <div>
                <h3 className="text-yellow-500/70 text-xs uppercase tracking-wider mb-2 flex items-center gap-2 px-2">
                  <HelpCircle size={14} />
                  <span>{t('nav.supportSection') || 'Soporte'}</span>
                </h3>
                <div className="space-y-1">
                  <a
                    href="/rules"
                    onClick={closeMenu}
                    className="flex items-center gap-3 text-gray-300 hover:text-yellow-500 transition-colors py-3 px-4 rounded-lg hover:bg-white/5 group"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-600 group-hover:bg-yellow-500 transition-colors" />
                    {t('nav.rules')}
                  </a>
                  <a
                    href="/support"
                    onClick={closeMenu}
                    className="flex items-center gap-3 text-gray-300 hover:text-yellow-500 transition-colors py-3 px-4 rounded-lg hover:bg-white/5 group"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-600 group-hover:bg-yellow-500 transition-colors" />
                    {t('nav.support')}
                  </a>
                </div>
              </div>
            </nav>

            {/* Bottom decorative divider */}
            <div className="mt-8 pt-6">
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent" />
                <div className="flex items-center gap-1 text-yellow-600/40">
                  <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                  </svg>
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                  </svg>
                  <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                  </svg>
                </div>
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent" />
              </div>
              <p className="text-gray-600 text-xs text-center mt-4">© 2025 Mystovia</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
