"use client";

import Link from "next/link";
import { GameCardArt } from "@/components/game-art/GameCardArt";
import { GameMetaChips } from "@/components/GameMetaChips";
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
  const showPlayCount = (statsEnabled || initialPlayCount != null) && playCount > 0;
  const playable = game.status === "playable";
  const playHref = playable ? `/play/${game.slug}` : `/games/${game.slug}`;

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-surface-border bg-surface-raised transition duration-300 hover:border-accent/40 hover:shadow-lg hover:shadow-accent/10">
      <div className="pointer-events-none">
        <GameCardArt game={game} />
      </div>

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
        <h4 className="text-lg font-semibold tracking-tight text-white/95">
          {game.title}
        </h4>
        <p className="mt-2 flex-1 text-sm text-slate-400 line-clamp-2">
          {game.description}
        </p>
        <div className="mt-auto pt-3">
          <GameMetaChips
            game={game}
            showOnlineChip={onlineEnabled && isOnlineGame(game.slug)}
          />
          {showPlayCount ? (
            <PlayCountIndicator count={playCount} className="mt-2.5" />
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
