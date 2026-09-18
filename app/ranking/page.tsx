import Link from "next/link";
import { BackToHomeLink } from "@/components/BackToHomeLink";
import { PageContainer } from "@/components/PageContainer";
import { RankingList } from "@/components/RankingList";
import { fetchRanking, parseRankingPeriod } from "@/lib/stats/ranking-data";
import type { RankingPeriod } from "@/lib/stats/jst-date";

const PERIODS: { key: RankingPeriod; label: string }[] = [
  { key: "day", label: "日間" },
  { key: "week", label: "週間" },
  { key: "month", label: "月間" },
  { key: "all", label: "全期間" },
];

type Props = { searchParams: Promise<{ period?: string }> };

export default async function RankingPage({ searchParams }: Props) {
  const { period: periodParam } = await searchParams;
  const period = parseRankingPeriod(periodParam);
  const ranking = await fetchRanking(period);

  return (
    <PageContainer>
      <BackToHomeLink />
      <h1 className="mt-4 text-2xl font-bold">プレイ回数ランキング</h1>
      <p className="mt-2 text-sm text-slate-400">
        ゲーム開始時にカウントされます（JST 基準）
      </p>

      <div className="mt-6 flex flex-wrap gap-2" role="tablist">
        {PERIODS.map((p) => (
          <Link
            key={p.key}
            href={`/ranking?period=${p.key}`}
            role="tab"
            aria-selected={period === p.key}
            className={`inline-flex min-h-9 items-center justify-center rounded-full px-4 text-sm font-medium leading-none transition ${
              period === p.key
                ? "bg-accent text-white"
                : "bg-white/10 text-slate-300 ring-1 ring-white/10 hover:bg-white/15"
            }`}
          >
            {p.label}
          </Link>
        ))}
      </div>

      <div className="mt-8">
        <RankingList ranking={ranking} />
      </div>
    </PageContainer>
  );
}
