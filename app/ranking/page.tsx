import Link from "next/link";
import { RankingList } from "@/components/RankingList";
import { fetchRanking, parseRankingPeriod } from "@/lib/stats/ranking-data";
import type { RankingPeriod } from "@/lib/stats/jst-date";

const PERIODS: { key: RankingPeriod; label: string }[] = [
  { key: "day", label: "今日" },
  { key: "week", label: "7日間" },
  { key: "month", label: "30日間" },
  { key: "all", label: "全期間" },
];

type Props = { searchParams: Promise<{ period?: string }> };

export default async function RankingPage({ searchParams }: Props) {
  const { period: periodParam } = await searchParams;
  const period = parseRankingPeriod(periodParam);
  const ranking = await fetchRanking(period);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <Link href="/" className="text-sm text-slate-400 transition hover:text-white">
        ← ゲーム一覧
      </Link>
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
            className={`min-h-9 rounded-full px-4 text-sm font-medium transition ${
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
    </div>
  );
}
