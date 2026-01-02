import { useState, useEffect } from 'react';
import { Twitch } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { verifyAuth } from '../utils/api';
import '../i18n';

export default function TwitchButton() {
  const { t, i18n } = useTranslation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const storedLang = localStorage.getItem('mystovia-language');
    if (storedLang && storedLang !== i18n.language) {
      i18n.changeLanguage(storedLang);
    }
    checkAuth();
  }, [i18n]);

  const checkAuth = async () => {
    try {
      const result = await verifyAuth();
      if (result.success && result.data?.user) {
        setIsLoggedIn(true);
      }
    } catch (error) {
      setIsLoggedIn(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !isClient) {
    return null;
  }

  const href = isLoggedIn ? '/account-management' : '/login?redirect=/account-management';

  return (
    <a
      href={href}
      className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 border border-purple-500/40 hover:border-purple-400/60"
      style={{
        background: 'linear-gradient(to bottom, rgb(145 70 255 / 0.2), rgb(120 50 220 / 0.3))'
      }}
      title={t('footer.connectTwitch')}
    >
      <Twitch size={18} className="text-purple-400" />
      <span className="hidden xl:inline text-sm font-medium text-purple-300 hover:text-purple-200">
        Twitch
      </span>
    </a>
  );
}
