import { useServerStats } from '@hooks/useServerStats';

export default function ServerStats() {
  const { stats, loading, error } = useServerStats();

  if (loading)
    return <p className="text-white font-extrabold">Cargando información...</p>;
  if (error)
    return <p className="text-red-500 font-extrabold">Error: {error}</p>;

  return (
    <section className="relative flex flex-col items-start justify-center gap-2 text-center w-full p-5 backdrop-blur-md border border-white/30 h-full bg-black/30 rounded-xl">
      <h2 className="absolute -translate-x-1/2 w-[90%] -top-5 left-1/2 text-md font-bold text-black text-center p-1 rounded-lg bg-white medieval-font">
        ESTADO DEL SERVER
      </h2>

      <article className="flex flex-col items-start justify-center">
        <dt className="text-white font-bold">Jugadores Registrados</dt>
        <dd className="text-5xl font-extrabold medieval-font text-yellow-500">
          +{stats?.totalPlayers}
        </dd>
      </article>

      <article className="flex flex-col items-start justify-center">
        <dt className="text-white font-bold">Online</dt>
        <dd className="text-5xl font-extrabold medieval-font text-yellow-500">
          {stats?.onlinePlayers}
        </dd>
      </article>

      <article className="flex flex-col items-start justify-center">
        <dt className="text-white font-bold">Versión</dt>
        <dd className="text-5xl font-extrabold medieval-font text-yellow-500">
          8.6
        </dd>
      </article>
    </section>
  );
}
