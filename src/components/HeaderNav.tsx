import { useTranslation } from 'react-i18next';
import { Store } from 'lucide-react';
import { useState, useEffect } from 'react';
import '../i18n';
import { openDownloadModal } from './DownloadModal';

export default function HeaderNav() {
  const { t, i18n } = useTranslation();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const storedLang = localStorage.getItem('mystovia-language');
    if (storedLang && storedLang !== i18n.language) {
      i18n.changeLanguage(storedLang);
    }
  }, [i18n]);

  const handleDownloadClick = (e: React.MouseEvent) => {
    e.preventDefault();
    openDownloadModal();
  };

  if (!isClient) {
    return (
      <nav className="hidden lg:flex w-full medieval-font font-semibold items-center justify-center gap-3 xl:gap-5 px-4 py-2">
        <a href="/marketplace" className="store-button">
          <Store size={16} /> <span className="opacity-0">Store</span>
        </a>
        <a href="/news" className="nav-link"><span className="opacity-0">News</span></a>
        <a href="/forum" className="nav-link"><span className="opacity-0">Forum</span></a>
        <a href="/guilds" className="nav-link"><span className="opacity-0">Guilds</span></a>
        <a href="/highscores" className="nav-link"><span className="opacity-0">Highscores</span></a>
        <a href="/online" className="nav-link"><span className="opacity-0">Online</span></a>
        <a href="/latest-deaths" className="nav-link"><span className="opacity-0">Deaths</span></a>
        <button className="nav-link"><span className="opacity-0">Downloads</span></button>
        <a href="/rules" className="nav-link"><span className="opacity-0">Rules</span></a>
      </nav>
    );
  }

  return (
    <nav className="hidden lg:flex w-full medieval-font font-semibold items-center justify-center gap-3 xl:gap-5 px-4 py-2">
      <a href="/marketplace" className="store-button">
        <Store size={16} /> {t('nav.store')}
      </a>
      <a href="/news" className="nav-link">{t('nav.news')}</a>
      <a href="/forum" className="nav-link">{t('nav.forum')}</a>
      <a href="/guilds" className="nav-link">{t('nav.guilds')}</a>
      <a href="/highscores" className="nav-link">{t('nav.highscores')}</a>
      <a href="/online" className="nav-link">{t('nav.online')}</a>
      <a href="/latest-deaths" className="nav-link">{t('nav.latestDeaths')}</a>
      <button onClick={handleDownloadClick} className="nav-link cursor-pointer">{t('nav.downloads')}</button>
      <a href="/rules" className="nav-link">{t('nav.rules')}</a>
    </nav>
  );
}
