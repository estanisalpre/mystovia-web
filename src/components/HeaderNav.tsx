import { useTranslation } from 'react-i18next';
import { Store } from 'lucide-react';
import '../i18n';

export default function HeaderNav() {
  const { t } = useTranslation();

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
      <a href="/faqs" className="nav-link">{t('nav.faqs')}</a>
      <a href="/support" className="nav-link">{t('nav.support')}</a>
    </nav>
  );
}
