import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Store, Menu, X, Gamepad2, Users, HelpCircle, Star, Bot } from 'lucide-react';
import HeaderAuth from './HeaderAuth';
import '../i18n';
import { openDownloadModal } from './DownloadModal';
import { CornerOrnaments, DiamondPattern, GoldenLine } from './ui';

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
        <aside
          className="lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Menú de navegación"
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
          <DiamondPattern opacity={0.05} />
          <GoldenLine position="top" thickness="thick" />
          <CornerOrnaments variant="bracket" size="xl" opacity={0.1} offset={4} />

          {/* Scrollable Content */}
          <div className="relative z-10 w-full h-full overflow-y-auto pt-16 pb-8 px-6">
            {/* Mobile Auth (at top) */}
            <div className="flex items-center justify-center gap-4 mb-6">
              <HeaderAuth />
            </div>

            {/* Decorative divider */}
            <div className="flex items-center gap-3 mb-6" role="separator" aria-hidden="true">
              <span className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent" />
              <span className="flex items-center gap-1 text-yellow-600/40">
                <Star className="w-2 h-2" fill="currentColor" />
                <Star className="w-3 h-3" fill="currentColor" />
                <Star className="w-2 h-2" fill="currentColor" />
              </span>
              <span className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent" />
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
            <nav className="flex flex-col gap-5" aria-label="Navegación principal">
              {/* Game Section */}
              <section aria-labelledby="nav-game-heading">
                <h3 id="nav-game-heading" className="text-yellow-500/70 text-xs uppercase tracking-wider mb-2 flex items-center gap-2 px-2">
                  <Gamepad2 size={14} aria-hidden="true" />
                  <span>{t('nav.game') || 'Juego'}</span>
                </h3>
                <ul className="space-y-1">
                  <li>
                    <button
                      onClick={() => {
                        closeMenu();
                        openDownloadModal();
                      }}
                      className="flex items-center gap-3 text-gray-300 hover:text-yellow-500 transition-colors py-3 px-4 rounded-lg hover:bg-white/5 group w-full text-left"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-600 group-hover:bg-yellow-500 transition-colors" aria-hidden="true" />
                      {t('nav.downloads')}
                    </button>
                  </li>
                  <li>
                    <a
                      href="/wiki"
                      onClick={closeMenu}
                      className="flex items-center gap-3 text-gray-300 hover:text-yellow-500 transition-colors py-3 px-4 rounded-lg hover:bg-white/5 group"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-600 group-hover:bg-yellow-500 transition-colors" aria-hidden="true" />
                      {t('nav.wiki')}
                    </a>
                  </li>
                  <li>
                    <a
                      href="/guides"
                      onClick={closeMenu}
                      className="flex items-center gap-3 text-gray-300 hover:text-yellow-500 transition-colors py-3 px-4 rounded-lg hover:bg-white/5 group"
                    >
                      <Bot size={14} className="text-gray-600 group-hover:text-yellow-500 transition-colors" aria-hidden="true" />
                      {t('nav.guides')}
                    </a>
                  </li>
                  <li>
                    <a
                      href="/highscores"
                      onClick={closeMenu}
                      className="flex items-center gap-3 text-gray-300 hover:text-yellow-500 transition-colors py-3 px-4 rounded-lg hover:bg-white/5 group"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-600 group-hover:bg-yellow-500 transition-colors" aria-hidden="true" />
                      {t('nav.highscores')}
                    </a>
                  </li>
                  <li>
                    <a
                      href="/online"
                      onClick={closeMenu}
                      className="flex items-center gap-3 text-gray-300 hover:text-yellow-500 transition-colors py-3 px-4 rounded-lg hover:bg-white/5 group"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-600 group-hover:bg-yellow-500 transition-colors" aria-hidden="true" />
                      {t('nav.online')}
                    </a>
                  </li>
                  <li>
                    <a
                      href="/latest-deaths"
                      onClick={closeMenu}
                      className="flex items-center gap-3 text-gray-300 hover:text-yellow-500 transition-colors py-3 px-4 rounded-lg hover:bg-white/5 group"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-600 group-hover:bg-yellow-500 transition-colors" aria-hidden="true" />
                      {t('nav.latestDeaths')}
                    </a>
                  </li>
                </ul>
              </section>

              {/* Community Section */}
              <section aria-labelledby="nav-community-heading">
                <h3 id="nav-community-heading" className="text-yellow-500/70 text-xs uppercase tracking-wider mb-2 flex items-center gap-2 px-2">
                  <Users size={14} aria-hidden="true" />
                  <span>{t('nav.community') || 'Comunidad'}</span>
                </h3>
                <ul className="space-y-1">
                  <li>
                    <a
                      href="/news"
                      onClick={closeMenu}
                      className="flex items-center gap-3 text-gray-300 hover:text-yellow-500 transition-colors py-3 px-4 rounded-lg hover:bg-white/5 group"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-600 group-hover:bg-yellow-500 transition-colors" aria-hidden="true" />
                      {t('nav.news')}
                    </a>
                  </li>
                  <li>
                    <a
                      href="/forum"
                      onClick={closeMenu}
                      className="flex items-center gap-3 text-gray-300 hover:text-yellow-500 transition-colors py-3 px-4 rounded-lg hover:bg-white/5 group"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-600 group-hover:bg-yellow-500 transition-colors" aria-hidden="true" />
                      {t('nav.forum')}
                    </a>
                  </li>
                  <li>
                    <a
                      href="/guilds"
                      onClick={closeMenu}
                      className="flex items-center gap-3 text-gray-300 hover:text-yellow-500 transition-colors py-3 px-4 rounded-lg hover:bg-white/5 group"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-600 group-hover:bg-yellow-500 transition-colors" aria-hidden="true" />
                      {t('nav.guilds')}
                    </a>
                  </li>
                </ul>
              </section>

              {/* Support Section */}
              <section aria-labelledby="nav-support-heading">
                <h3 id="nav-support-heading" className="text-yellow-500/70 text-xs uppercase tracking-wider mb-2 flex items-center gap-2 px-2">
                  <HelpCircle size={14} aria-hidden="true" />
                  <span>{t('nav.supportSection') || 'Soporte'}</span>
                </h3>
                <ul className="space-y-1">
                  <li>
                    <a
                      href="/rules"
                      onClick={closeMenu}
                      className="flex items-center gap-3 text-gray-300 hover:text-yellow-500 transition-colors py-3 px-4 rounded-lg hover:bg-white/5 group"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-600 group-hover:bg-yellow-500 transition-colors" aria-hidden="true" />
                      {t('nav.rules')}
                    </a>
                  </li>
                </ul>
              </section>
            </nav>

            {/* Bottom decorative divider */}
            <footer className="mt-8 pt-6">
              <div className="flex items-center gap-3" role="separator" aria-hidden="true">
                <span className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent" />
                <span className="flex items-center gap-1 text-yellow-600/40">
                  <Star className="w-2 h-2" fill="currentColor" />
                  <Star className="w-3 h-3" fill="currentColor" />
                  <Star className="w-2 h-2" fill="currentColor" />
                </span>
                <span className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent" />
              </div>
              <p className="text-gray-600 text-xs text-center mt-4">© 2025 Mystovia</p>
            </footer>
          </div>
        </aside>
      )}
    </>
  );
}
