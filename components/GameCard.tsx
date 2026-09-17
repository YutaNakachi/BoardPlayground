import Link from "next/link";
import { GameCardArt } from "@/components/game-art/GameCardArt";
import { GameMetaChips } from "@/components/GameMetaChips";
import { ORIGIN_LABEL, type GameMeta } from "@/lib/games";

type Props = { game: GameMeta };

export function GameCard({ game }: Props) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-3xl border border-surface-border bg-surface-raised transition hover:border-accent/40 hover:shadow-lg hover:shadow-accent/10">
      <GameCardArt game={game} />
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2 flex flex-wrap gap-1.5">
          <span className="rounded-md bg-accent/15 px-2 py-0.5 text-xs text-accent">
            {ORIGIN_LABEL[game.origin]}
          </span>
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
        <div className="mt-4 flex gap-2">
          <Link
            href={`/games/${game.slug}`}
            className="flex min-h-11 flex-1 items-center justify-center rounded-lg border border-surface-border py-2 text-center text-sm transition hover:bg-surface-border"
          >
            ルール
          </Link>
          {game.status === "playable" ? (
            <Link
              href={`/play/${game.slug}`}
              className="btn-play flex min-h-11 flex-1 items-center justify-center rounded-xl py-2 text-center text-sm font-bold text-white shadow-md shadow-accent/20 transition"
            >
              遊ぶ！
            </Link>
          ) : (
            <span className="flex min-h-11 flex-1 items-center justify-center rounded-lg bg-surface-border py-2 text-center text-sm text-slate-500">
              準備中
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
