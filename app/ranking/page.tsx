import { BackToHomeLink } from "@/components/BackToHomeLink";
import { PageContainer } from "@/components/PageContainer";
import { RankingTabs } from "@/components/RankingTabs";
import {
  fetchRankingCached,
  parseRankingPeriod,
} from "@/lib/stats/ranking-data";
import { checkStatsHealth } from "@/lib/supabase/health";
import { isSupabaseConfigured } from "@/lib/supabase/config";

type Props = { searchParams: Promise<{ period?: string }> };

export const revalidate = 60;

export default async function RankingPage({ searchParams }: Props) {
  const { period: periodParam } = await searchParams;
  const period = parseRankingPeriod(periodParam);

  if (!isSupabaseConfigured()) {
    return (
      <PageContainer>
        <BackToHomeLink />
        <h1 className="mt-4 text-2xl font-bold">プレイ回数ランキング</h1>
        <p className="mt-2 text-sm text-slate-400">
          ゲーム開始時にカウントされます（JST 基準）
        </p>
        <RankingTabs initialPeriod={period} initialRanking={[]} statsEnabled={false} />
      </PageContainer>
    );
  }

  const [statsHealth, ranking] = await Promise.all([
    checkStatsHealth(),
    fetchRankingCached(period),
  ]);

  return (
    <PageContainer>
      <BackToHomeLink />
      <h1 className="mt-4 text-2xl font-bold">プレイ回数ランキング</h1>
      <p className="mt-2 text-sm text-slate-400">
        ゲーム開始時にカウントされます（JST 基準）
      </p>

      <RankingTabs
        initialPeriod={period}
        initialRanking={statsHealth.stats ? ranking : []}
        statsEnabled={statsHealth.stats}
      />
    </PageContainer>
  );
}
