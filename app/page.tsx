import { GameCatalog } from "@/components/GameCatalog";
import { PageContainer } from "@/components/PageContainer";
import { SiteBrand } from "@/components/SiteBrand";
import { fetchGameCounts } from "@/lib/stats/game-counts";
import { SITE_TAGLINE, SITE_TAGLINE_SUB } from "@/lib/site";
import { getAllGames } from "@/lib/games";

export default async function HomePage() {
  const games = getAllGames();
  const { counts: initialPlayCounts } = await fetchGameCounts();

  return (
    <PageContainer>
      <section className="relative mb-12 overflow-hidden rounded-3xl border border-surface-border hero-glow px-6 py-12 text-center sm:mb-14 sm:px-10 sm:py-14">
        <div
          className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-accent/20 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-10 -left-6 h-28 w-28 rounded-full bg-accent-warm/15 blur-3xl"
          aria-hidden
        />
        <SiteBrand variant="hero" />
        <p className="mt-6 text-xl font-bold text-white sm:text-2xl">{SITE_TAGLINE}</p>
        <p className="mx-auto mt-3 max-w-lg text-base text-slate-400 sm:text-lg">
          {SITE_TAGLINE_SUB}
        </p>
      </section>

      <GameCatalog games={games} initialPlayCounts={initialPlayCounts} />
    </PageContainer>
  );
}
