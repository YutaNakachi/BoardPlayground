"use client";

import { useCallback } from "react";
import { usePlayStats } from "@/components/PlayStatsProvider";
import type { PlayMode } from "@/lib/online/types";

export function useRecordPlay(slug: string) {
  const { refresh, statsEnabled } = usePlayStats();

  const record = useCallback(
    (mode: PlayMode = "local") => {
      if (!statsEnabled) return;
      void fetch("/api/stats/play", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, mode }),
      })
        .then((res) => res.json())
        .then((data: { ok?: boolean; skipped?: boolean }) => {
          if (data.ok && !data.skipped) refresh();
        })
        .catch(() => {});
    },
    [slug, refresh, statsEnabled]
  );

  return record;
}
