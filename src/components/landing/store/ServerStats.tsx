import { useTranslation } from 'react-i18next';
import { useServerStats } from '@hooks/useServerStats';
import '../../../i18n';
import { DiamondPattern, GoldenLine, CornerOrnaments } from '../../ui';

export default function ServerStats() {
  const { t } = useTranslation();
  const { stats, loading, error } = useServerStats();

  if (loading)
    return (
      <section className="relative flex flex-col items-center justify-center w-full h-full rounded-xl overflow-hidden"
               style={{ background: 'linear-gradient(to bottom, rgb(17 24 39 / 0.98), rgb(17 24 39), rgb(0 0 0 / 0.98))' }}>
        <DiamondPattern opacity={0.03} rounded />
        <div className="absolute inset-0 rounded-xl border border-yellow-600/20 pointer-events-none"></div>
        <div className="w-8 h-8 border-2 border-yellow-500/30 border-t-yellow-500 rounded-full animate-spin"></div>
        <p className="text-yellow-500/70 text-sm mt-3">{t('common.loadingInfo')}</p>
      </section>
    );

  if (error)
    return (
      <section className="relative flex flex-col items-center justify-center w-full h-full rounded-xl overflow-hidden"
               style={{ background: 'linear-gradient(to bottom, rgb(17 24 39 / 0.98), rgb(17 24 39), rgb(0 0 0 / 0.98))' }}>
        <div className="absolute inset-0 rounded-xl border border-red-600/20 pointer-events-none"></div>
        <p className="text-red-500 font-medium">{t('common.error')}: {error}</p>
      </section>
    );

  return (
    <section className="relative flex flex-col items-start justify-center gap-3 w-full h-full p-5 pt-12 rounded-xl overflow-hidden"
             style={{ background: 'linear-gradient(to bottom, rgb(17 24 39 / 0.98), rgb(17 24 39), rgb(0 0 0 / 0.98))' }}>
      {/* Diamond pattern overlay */}
      <DiamondPattern opacity={0.03} rounded />

      {/* Top golden line */}
      <GoldenLine position="top" />

      {/* Border */}
      <div className="absolute inset-0 rounded-xl border border-yellow-600/20 pointer-events-none"></div>

      {/* Corner ornaments */}
      <CornerOrnaments variant="curve" size="md" opacity={0.2} />

      {/* Header badge */}
      <div className="absolute -top-0.5 left-1/2 -translate-x-1/2">
        <div className="relative px-4 py-2 rounded-b-lg" style={{ background: 'linear-gradient(to bottom, rgb(234 179 8 / 0.9), rgb(202 138 4 / 0.9))' }}>
          <div className="absolute inset-0 rounded-b-lg border border-yellow-400/30 pointer-events-none"></div>
          <h2 className="text-sm font-bold text-black text-center medieval-font relative z-10 whitespace-nowrap">
            {t('serverStats.title')}
          </h2>
        </div>
      </div>

      {/* Stats content */}
      <div className="relative z-10 space-y-3 w-full">
        <article className="flex flex-col items-start justify-center">
          <dt className="text-gray-400 text-sm">{t('serverStats.registeredPlayers')}</dt>
          <dd className="text-4xl font-extrabold medieval-font text-yellow-500">
            +{stats?.totalPlayers}
          </dd>
        </article>

        {/* Decorative divider */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-yellow-500/20 to-transparent"></div>
        </div>

        <article className="flex flex-col items-start justify-center">
          <dt className="text-gray-400 text-sm">{t('serverStats.online')}</dt>
          <dd className="text-4xl font-extrabold medieval-font text-yellow-500">
            {stats?.onlinePlayers}
          </dd>
        </article>

        {/* Decorative divider */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-yellow-500/20 to-transparent"></div>
        </div>

        <article className="flex flex-col items-start justify-center">
          <dt className="text-gray-400 text-sm">{t('common.version')}</dt>
          <dd className="text-4xl font-extrabold medieval-font text-yellow-500">
            8.6
          </dd>
        </article>
      </div>
    </section>
  );
}
