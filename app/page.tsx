import { GameCatalog } from "@/components/GameCatalog";
import { SITE_NAME, SITE_TAGLINE, SITE_TAGLINE_SUB } from "@/lib/site";
import { getAllGames } from "@/lib/games";

export default function HomePage() {
  const games = getAllGames();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
      <section className="relative mb-12 overflow-hidden rounded-3xl border border-surface-border hero-glow px-6 py-12 text-center sm:mb-14 sm:px-10 sm:py-14">
        <div
          className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-accent/20 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-10 -left-6 h-28 w-28 rounded-full bg-accent-warm/15 blur-3xl"
          aria-hidden
        />
        <h1 className="font-display text-balance text-5xl font-extrabold tracking-tight sm:text-6xl">
          <span className="bg-gradient-to-r from-accent via-pink-300 to-accent-warm bg-clip-text text-transparent">
            {SITE_NAME}
          </span>
        </h1>
        <p className="mt-4 text-xl font-bold text-white sm:text-2xl">{SITE_TAGLINE}</p>
        <p className="mx-auto mt-3 max-w-lg text-base text-slate-400 sm:text-lg">
          {SITE_TAGLINE_SUB}
        </p>
      </section>

      <GameCatalog games={games} />
    </div>
  );
}
