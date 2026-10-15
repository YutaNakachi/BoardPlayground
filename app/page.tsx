import { GameCatalog } from "@/components/GameCatalog";
import { PageContainer } from "@/components/PageContainer";
import { SiteAnnouncementBar } from "@/components/SiteAnnouncementBar";
import { fetchGameCounts } from "@/lib/stats/game-counts";
import { getAllGames } from "@/lib/games";

export default async function HomePage() {
  const games = getAllGames();
  const { counts: initialPlayCounts } = await fetchGameCounts();

  return (
    <>
      <SiteAnnouncementBar />
      <PageContainer>
        <GameCatalog games={games} initialPlayCounts={initialPlayCounts} />
      </PageContainer>
    </>
  );
}
