"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { RankingList } from "@/components/RankingList";
import type { RankingEntry } from "@/lib/stats/ranking-data";
import type { RankingPeriod } from "@/lib/stats/jst-date";

const PERIODS: { key: RankingPeriod; label: string }[] = [
  { key: "day", label: "日間" },
  { key: "week", label: "週間" },
  { key: "month", label: "月間" },
  { key: "all", label: "全期間" },
];

type Props = {
  initialPeriod: RankingPeriod;
  initialRanking: RankingEntry[];
  statsEnabled: boolean;
};

export function RankingTabs({
  initialPeriod,
  initialRanking,
  statsEnabled,
}: Props) {
  const [period, setPeriod] = useState(initialPeriod);
  const [ranking, setRanking] = useState(initialRanking);
  const [loading, setLoading] = useState(false);
  const cacheRef = useRef<Partial<Record<RankingPeriod, RankingEntry[]>>>({
    [initialPeriod]: initialRanking,
  });

  const loadPeriod = useCallback(async (next: RankingPeriod) => {
    const cached = cacheRef.current[next];
    setPeriod(next);
    if (cached) {
      setRanking(cached);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/stats/ranking?period=${next}`, {
        cache: "no-store",
      });
      const data = (await res.json()) as { ranking?: RankingEntry[] };
      const nextRanking = data.ranking ?? [];
      cacheRef.current[next] = nextRanking;
      setRanking(nextRanking);
    } catch {
      setRanking([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    for (const { key } of PERIODS) {
      if (key === period || cacheRef.current[key]) continue;
      void fetch(`/api/stats/ranking?period=${key}`, { cache: "no-store" })
        .then((res) => res.json())
        .then((data: { ranking?: RankingEntry[] }) => {
          cacheRef.current[key] = data.ranking ?? [];
        })
        .catch(() => {});
    }
  }, [period]);

  if (!statsEnabled) {
    return (
      <p className="text-slate-400">
        ランキングは現在利用できません。Supabase の環境変数とマイグレーションの設定を確認してください。
      </p>
    );
  }

  return (
    <>
      <div className="mt-6 flex flex-wrap gap-2" role="tablist">
        {PERIODS.map((p) => (
          <button
            key={p.key}
            type="button"
            role="tab"
            aria-selected={period === p.key}
            disabled={loading && period === p.key}
            onClick={() => void loadPeriod(p.key)}
            className={`inline-flex min-h-9 items-center justify-center rounded-full px-4 text-sm font-medium leading-none transition disabled:opacity-70 ${
              period === p.key
                ? "bg-accent text-white"
                : "bg-white/10 text-slate-300 ring-1 ring-white/10 hover:bg-white/15"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div
        className={`mt-8 transition-opacity duration-150 ${loading ? "opacity-60" : "opacity-100"}`}
        aria-busy={loading}
      >
        <RankingList ranking={ranking} />
      </div>
    </>
  );
}
