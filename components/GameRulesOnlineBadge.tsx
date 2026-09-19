"use client";

import { OnlineBadge } from "@/components/GameMetaIndicators";
import { usePlayStats } from "@/components/PlayStatsProvider";
import { isOnlineGame } from "@/lib/online/types";

type Props = { slug: string };

export function GameRulesOnlineBadge({ slug }: Props) {
  const { onlineEnabled } = usePlayStats();
  if (!onlineEnabled || !isOnlineGame(slug)) return null;
  return <OnlineBadge className="rounded-full px-3 py-1" />;
}
