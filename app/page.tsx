import { GameCatalog } from "@/components/GameCatalog";
import { PageContainer } from "@/components/PageContainer";
import { SiteBrand } from "@/components/SiteBrand";
import { fetchGameCounts } from "@/lib/stats/game-counts";
import { HeroTaglines } from "@/components/HeroTaglines";
import { getAllGames } from "@/lib/games";

export default async function HomePage() {
  const games = getAllGames();
  const { counts: initialPlayCounts } = await fetchGameCounts();

  return (
    <PageContainer>
      <section className="relative mb-10 overflow-hidden rounded-3xl border border-surface-border hero-glow px-6 py-8 text-center sm:mb-12 sm:px-10 sm:py-10">
        <div
          className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-accent/20 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-10 -left-6 h-28 w-28 rounded-full bg-accent-warm/15 blur-3xl"
          aria-hidden
        />
        <SiteBrand variant="hero" />
        <HeroTaglines />
      </section>

      <GameCatalog games={games} initialPlayCounts={initialPlayCounts} />
    </PageContainer>
  );
}
