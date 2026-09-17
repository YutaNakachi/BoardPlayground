import Link from "next/link";
import { GameCardArt } from "@/components/game-art/GameCardArt";
import { GameMetaChips } from "@/components/GameMetaChips";
import { OriginChip } from "@/components/OriginChip";
import type { GameMeta } from "@/lib/games";

type Props = { game: GameMeta };

export function GameCard({ game }: Props) {
  const playable = game.status === "playable";
  const playHref = playable ? `/play/${game.slug}` : `/games/${game.slug}`;

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-3xl border border-surface-border bg-surface-raised transition hover:border-accent/40 hover:shadow-lg hover:shadow-accent/10">
      <Link
        href={playHref}
        className="absolute inset-0 z-0 rounded-3xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        aria-label={playable ? `${game.title}を遊ぶ` : `${game.title}の詳細`}
      />

      <GameCardArt game={game} />
      <div className="pointer-events-none relative z-10 flex flex-1 flex-col p-5">
        <div className="mb-2 flex flex-wrap gap-1.5">
          <OriginChip origin={game.origin} />
          {game.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-md bg-surface-border/50 px-2 py-0.5 text-xs text-slate-400"
            >
              {tag}
            </span>
          ))}
        </div>
        <h4 className="text-lg font-semibold transition group-hover:text-accent">
          {game.title}
        </h4>
        <p className="mt-2 flex-1 text-sm text-slate-400 line-clamp-2">
          {game.description}
        </p>
        <div className="mt-3">
          <GameMetaChips game={game} />
        </div>
        <div className="mt-4">
          <Link
            href={`/games/${game.slug}`}
            className="pointer-events-auto inline-flex min-h-10 items-center rounded-lg border border-surface-border px-4 text-sm transition hover:bg-surface-border"
          >
            ルール
          </Link>
        </div>
      </div>
    </article>
  );
}
