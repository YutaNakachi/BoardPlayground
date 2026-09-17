import { GameCatalog } from "@/components/GameCatalog";
import { SITE_NAME, SITE_TAGLINE, SITE_TAGLINE_SUB } from "@/lib/site";
import { getAllGames } from "@/lib/games";

export default function HomePage() {
  const games = getAllGames();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
      <section className="mb-14 text-center">
        <h1 className="font-display text-balance text-5xl font-extrabold tracking-tight text-white sm:text-6xl">
          {SITE_NAME}
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg font-semibold text-slate-200 sm:text-xl">
          {SITE_TAGLINE}
        </p>
        <p className="mx-auto mt-2 max-w-2xl text-base text-slate-400 sm:text-lg">
          {SITE_TAGLINE_SUB}
        </p>
      </section>

      <GameCatalog games={games} />
    </div>
  );
}
