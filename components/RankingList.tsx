import Link from "next/link";
import { formatPlayCount } from "@/lib/format-play-count";
import type { RankingEntry } from "@/lib/stats/ranking-data";

type Props = { ranking: RankingEntry[] };

export function RankingList({ ranking }: Props) {
  if (ranking.length === 0) {
    return <p className="text-slate-400">まだプレイデータがありません。</p>;
  }

  return (
    <ol className="divide-y divide-white/10 rounded-2xl border border-white/10 bg-surface-raised">
      {ranking.map((entry) => (
        <li key={entry.slug} className="flex items-center gap-4 px-5 py-4">
          <span
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
              entry.rank <= 3
                ? "bg-accent/30 text-accent"
                : "bg-white/10 text-slate-400"
            }`}
          >
            {entry.rank}
          </span>
          <div className="min-w-0 flex-1">
            <Link
              href={`/play/${entry.slug}`}
              className="font-medium text-white hover:text-accent"
            >
              {entry.title}
            </Link>
          </div>
          <span className="shrink-0 text-sm text-slate-400">
            {formatPlayCount(entry.playCount)}回
          </span>
        </li>
      ))}
    </ol>
  );
}
