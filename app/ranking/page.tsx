import { BackToHomeLink } from "@/components/BackToHomeLink";
import { PageContainer } from "@/components/PageContainer";
import { RankingTabs } from "@/components/RankingTabs";
import { fetchRanking, parseRankingPeriod } from "@/lib/stats/ranking-data";
import { checkBackendHealth } from "@/lib/supabase/health";

type Props = { searchParams: Promise<{ period?: string }> };

export default async function RankingPage({ searchParams }: Props) {
  const { period: periodParam } = await searchParams;
  const period = parseRankingPeriod(periodParam);
  const health = await checkBackendHealth();
  const ranking = health.stats ? await fetchRanking(period) : [];

  return (
    <PageContainer>
      <BackToHomeLink />
      <h1 className="mt-4 text-2xl font-bold">プレイ回数ランキング</h1>
      <p className="mt-2 text-sm text-slate-400">
        ゲーム開始時にカウントされます（JST 基準）
      </p>

      <RankingTabs
        initialPeriod={period}
        initialRanking={ranking}
        statsEnabled={health.stats}
      />
    </PageContainer>
  );
}
