"use client";

import {
  createContext,
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { BackendHealth } from "@/lib/supabase/health";

type PlayStatsContextValue = {
  counts: Record<string, number>;
  getCount: (slug: string) => number | undefined;
  refresh: () => void;
  statsEnabled: boolean;
  onlineEnabled: boolean;
  backendLoading: boolean;
};

const PlayStatsContext = createContext<PlayStatsContextValue>({
  counts: {},
  getCount: () => undefined,
  refresh: () => {},
  statsEnabled: false,
  onlineEnabled: false,
  backendLoading: true,
});

type Props = {
  children: React.ReactNode;
  initialCounts?: Record<string, number>;
  initialStatsEnabled?: boolean;
  initialOnlineEnabled?: boolean;
};

export function PlayStatsProvider({
  children,
  initialCounts = {},
  initialStatsEnabled = false,
  initialOnlineEnabled = false,
}: Props) {
  const [counts, setCounts] = useState<Record<string, number>>(initialCounts);
  const [statsEnabled, setStatsEnabled] = useState(initialStatsEnabled);
  const [onlineEnabled, setOnlineEnabled] = useState(initialOnlineEnabled);
  const [backendLoading, setBackendLoading] = useState(
    !initialStatsEnabled && !initialOnlineEnabled
  );

  const loadCounts = useCallback(async () => {
    try {
      const res = await fetch("/api/stats/games", { cache: "no-store" });
      const data = await res.json();
      setCounts(data.counts ?? {});
      if (typeof data.enabled === "boolean") {
        setStatsEnabled(data.enabled);
      }
    } catch {
      setCounts({});
    }
  }, []);

  const loadBackend = useCallback(async () => {
    setBackendLoading(true);
    try {
      const res = await fetch("/api/status", { cache: "no-store" });
      const data = (await res.json()) as BackendHealth;
      setStatsEnabled(data.stats);
      setOnlineEnabled(data.online);
      if (data.stats) {
        await loadCounts();
      } else {
        setCounts({});
      }
    } catch {
      setStatsEnabled(false);
      setOnlineEnabled(false);
      setCounts({});
    } finally {
      setBackendLoading(false);
    }
  }, [loadCounts]);

  const refresh = useCallback(() => {
    void loadCounts();
  }, [loadCounts]);

  useEffect(() => {
    startTransition(() => {
      void loadBackend();
    });
  }, [loadBackend]);

  const value = useMemo(
    () => ({
      counts,
      getCount: (slug: string) => counts[slug],
      refresh,
      statsEnabled,
      onlineEnabled,
      backendLoading,
    }),
    [counts, refresh, statsEnabled, onlineEnabled, backendLoading]
  );

  return (
    <PlayStatsContext.Provider value={value}>{children}</PlayStatsContext.Provider>
  );
}

export function usePlayStats() {
  return useContext(PlayStatsContext);
}
