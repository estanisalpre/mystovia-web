import { useTranslation } from 'react-i18next';
import { useServerStats } from '@hooks/useServerStats';
import '../../../i18n';

export default function ServerStats() {
  const { t } = useTranslation();
  const { stats, loading, error } = useServerStats();

  if (loading)
    return <p className="text-white font-extrabold">{t('common.loadingInfo')}</p>;
  if (error)
    return <p className="text-red-500 font-extrabold">{t('common.error')}: {error}</p>;

  return (
    <section className="relative flex flex-col items-start justify-center gap-2 text-center w-full p-5 backdrop-blur-md border border-white/30 h-full bg-black/30 rounded-xl">
      <h2 className="absolute -translate-x-1/2 w-[90%] -top-5 left-1/2 text-md font-bold text-black text-center p-1 rounded-lg bg-white medieval-font">
        {t('serverStats.title')}
      </h2>

      <article className="flex flex-col items-start justify-center">
        <dt className="text-white font-bold">{t('serverStats.registeredPlayers')}</dt>
        <dd className="text-5xl font-extrabold medieval-font text-yellow-500">
          +{stats?.totalPlayers}
        </dd>
      </article>

      <article className="flex flex-col items-start justify-center">
        <dt className="text-white font-bold">{t('serverStats.online')}</dt>
        <dd className="text-5xl font-extrabold medieval-font text-yellow-500">
          {stats?.onlinePlayers}
        </dd>
      </article>

      <article className="flex flex-col items-start justify-center">
        <dt className="text-white font-bold">{t('common.version')}</dt>
        <dd className="text-5xl font-extrabold medieval-font text-yellow-500">
          8.6
        </dd>
      </article>
    </section>
  );
}
