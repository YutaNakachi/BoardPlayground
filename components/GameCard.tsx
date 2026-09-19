"use client";

import Link from "next/link";
import { GameCardArt } from "@/components/game-art/GameCardArt";
import { GameMetaIndicators, OnlineBadge } from "@/components/GameMetaIndicators";
import { OriginChip } from "@/components/OriginChip";
import { PlayCountIndicator } from "@/components/PlayCountIndicator";
import { usePlayStats } from "@/components/PlayStatsProvider";
import { TAG_CHIP_CLASS } from "@/lib/chip-styles";
import type { GameMeta } from "@/lib/games";
import { isOnlineGame } from "@/lib/online/types";

type Props = {
  game: GameMeta;
  initialPlayCount?: number;
};

export function GameCard({ game, initialPlayCount }: Props) {
  const { getCount, statsEnabled, onlineEnabled } = usePlayStats();
  const clientCount = getCount(game.slug);
  const playCount = clientCount ?? initialPlayCount ?? 0;
  const statsVisible = statsEnabled || initialPlayCount != null;
  const showPlayCount = statsVisible && playCount > 0;
  const showOnline = onlineEnabled && isOnlineGame(game.slug);
  const playable = game.status === "playable";
  const playHref = playable ? `/play/${game.slug}` : `/games/${game.slug}`;

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-surface-border bg-surface-raised transition duration-300 hover:border-accent/40 hover:shadow-lg hover:shadow-accent/10">
      <div className="pointer-events-none">
        <GameCardArt game={game} />
      </div>

      {showOnline ? (
        <div className="pointer-events-none absolute left-3 top-3 z-20">
          <OnlineBadge />
        </div>
      ) : null}

      <Link
        href={`/games/${game.slug}`}
        className="pointer-events-auto absolute right-3 top-3 z-20 inline-flex min-h-8 items-center rounded-full border border-white/20 bg-black/45 px-3 text-xs text-slate-200 backdrop-blur-sm transition hover:border-white/35 hover:bg-black/60 hover:text-white"
      >
        ルール
      </Link>

      <div className="pointer-events-none relative z-10 flex flex-1 flex-col p-5">
        <div className="mb-2 flex flex-wrap gap-1.5">
          <OriginChip origin={game.origin} />
          {game.tags.map((tag) => (
            <span key={tag} className={TAG_CHIP_CLASS}>
              {tag}
            </span>
          ))}
        </div>
        <h4 className="pr-16 text-lg font-semibold tracking-tight text-white/95">
          {game.title}
        </h4>
        <p className="mt-2 flex-1 text-sm text-slate-400 line-clamp-2">
          {game.description}
        </p>
        <div className="mt-auto flex items-center justify-between gap-3 pt-3">
          <GameMetaIndicators game={game} className="min-w-0 flex flex-wrap items-center gap-x-4 gap-y-1" />
          {statsVisible ? (
            <div className="flex h-5 shrink-0 items-center">
              {showPlayCount ? (
                <PlayCountIndicator count={playCount} />
              ) : (
                <span
                  className="invisible inline-flex items-center gap-1 text-sm tabular-nums"
                  aria-hidden
                >
                  <span className="inline-block h-4 w-4" />
                  <span>0</span>
                </span>
              )}
            </div>
          ) : null}
        </div>
      </div>

      <Link
        href={playHref}
        className="absolute inset-0 z-[1] rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        aria-label={playable ? `${game.title}を遊ぶ` : `${game.title}の詳細`}
      />
    </article>
  );
}
