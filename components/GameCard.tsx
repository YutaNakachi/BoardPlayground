import Link from "next/link";
import { GameCardArt } from "@/components/game-art/GameCardArt";
import { GameMetaChips } from "@/components/GameMetaChips";
import { OriginChip } from "@/components/OriginChip";
import { TAG_CHIP_CLASS } from "@/lib/chip-styles";
import type { GameMeta } from "@/lib/games";

type Props = { game: GameMeta };

export function GameCard({ game }: Props) {
  const playable = game.status === "playable";
  const playHref = playable ? `/play/${game.slug}` : `/games/${game.slug}`;

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-surface-border bg-surface-raised transition duration-300 hover:border-accent/40 hover:shadow-lg hover:shadow-accent/10">
      <Link
        href={playHref}
        className="absolute inset-0 z-0 rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        aria-label={playable ? `${game.title}を遊ぶ` : `${game.title}の詳細`}
      />

      <GameCardArt game={game} />
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
        <div className="mt-3">
          <GameMetaChips game={game} />
        </div>
        <div className="mt-4">
          <Link
            href={`/games/${game.slug}`}
            className="pointer-events-auto inline-flex min-h-9 items-center rounded-full border border-white/15 px-4 text-sm text-slate-300 transition hover:border-white/25 hover:text-white"
          >
            ルール
          </Link>
        </div>
      </div>
    </article>
  );
}
