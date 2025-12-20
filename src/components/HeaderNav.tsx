import { useTranslation } from 'react-i18next';
import { Store } from 'lucide-react';
import { useState, useEffect } from 'react';
import '../i18n';

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

  if (!isClient) {
    return (
      <nav className="hidden lg:flex w-full medieval-font font-semibold items-center justify-center gap-4 xl:gap-6 px-4 py-2">
        <a href="/marketplace" className="nav-link-important flex items-center gap-1">
          <Store size={18} /> <span className="opacity-0">Store</span>
        </a>
        <a href="/news" className="nav-link"><span className="opacity-0">News</span></a>
        <a href="/forum" className="nav-link"><span className="opacity-0">Forum</span></a>
        <a href="/wiki" className="nav-link"><span className="opacity-0">Wiki</span></a>
        <a href="/downloads" className="nav-link"><span className="opacity-0">Downloads</span></a>
        <a href="/rules" className="nav-link"><span className="opacity-0">Rules</span></a>
        <a href="/support" className="nav-link"><span className="opacity-0">Support</span></a>
      </nav>
    );
  }

  return (
    <nav className="hidden lg:flex w-full medieval-font font-semibold items-center justify-center gap-4 xl:gap-6 px-4 py-2">
      <a href="/marketplace" className="nav-link-important flex items-center gap-1">
        <Store size={18} /> {t('nav.store')}
      </a>
      <a href="/news" className="nav-link">{t('nav.news')}</a>
      <a href="/forum" className="nav-link">{t('nav.forum')}</a>
      <a href="/wiki" className="nav-link">{t('nav.wiki')}</a>
      <a href="/downloads" className="nav-link">{t('nav.downloads')}</a>
      <a href="/rules" className="nav-link">{t('nav.rules')}</a>
      <a href="/support" className="nav-link">{t('nav.support')}</a>
    </nav>
  );
}
