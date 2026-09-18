"use client";

import { useCallback } from "react";
import type { PlayMode } from "@/lib/online/types";

export function useRecordPlay(slug: string) {
  const record = useCallback(
    (mode: PlayMode = "local") => {
      void fetch("/api/stats/play", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, mode }),
      }).catch(() => {});
    },
    [slug]
  );

  return record;
}
