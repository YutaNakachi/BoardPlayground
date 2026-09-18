"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type PlayStatsContextValue = {
  counts: Record<string, number>;
  getCount: (slug: string) => number | undefined;
  refresh: () => void;
};

const PlayStatsContext = createContext<PlayStatsContextValue>({
  counts: {},
  getCount: () => undefined,
  refresh: () => {},
});

export function PlayStatsProvider({ children }: { children: React.ReactNode }) {
  const [counts, setCounts] = useState<Record<string, number>>({});

  const refresh = useCallback(() => {
    void fetch("/api/stats/games")
      .then((res) => res.json())
      .then((data: { counts?: Record<string, number> }) => {
        setCounts(data.counts ?? {});
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({
      counts,
      getCount: (slug: string) => counts[slug],
      refresh,
    }),
    [counts, refresh]
  );

  return (
    <PlayStatsContext.Provider value={value}>{children}</PlayStatsContext.Provider>
  );
}

export function usePlayStats() {
  return useContext(PlayStatsContext);
}
