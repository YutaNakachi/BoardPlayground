import { GameCatalog } from "@/components/GameCatalog";
import { SITE_HERO_COPY, SITE_NAME } from "@/lib/site";
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
        <p className="mx-auto mt-4 max-w-2xl text-base font-semibold leading-relaxed text-slate-200 sm:text-lg">
          {SITE_HERO_COPY.before}　
          <span
            className="mx-1 inline-block align-middle font-display text-4xl font-extrabold leading-none tracking-tight sm:mx-2 sm:text-5xl"
          >
            <span className="bg-gradient-to-r from-accent via-pink-300 to-accent-warm bg-clip-text text-transparent drop-shadow-[0_0_18px_rgba(255,92,138,0.35)]">
              {SITE_HERO_COPY.punch}
            </span>
          </span>
          　{SITE_HERO_COPY.after}
        </p>
      </section>

      <GameCatalog games={games} />
    </div>
  );
}
