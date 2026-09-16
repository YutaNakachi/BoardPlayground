import Link from "next/link";
import type { GameMeta } from "@/lib/games";

type Props = { game: GameMeta };

function bannerHue(slug: string) {
  const hues = [230, 265, 195, 28, 340];
  let hash = 0;
  for (const ch of slug) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return hues[hash % hues.length];
}

export function GameCard({ game }: Props) {
  const hue = bannerHue(game.slug);
  const initial = [...game.title][0] ?? "BP";

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-surface-border bg-surface-raised transition hover:border-accent/50 hover:shadow-lg hover:shadow-accent/5">
      <div
        className="flex h-32 items-center justify-center"
        style={{
          background: `linear-gradient(135deg, hsl(${hue} 70% 48% / 0.45), #1a2332 62%, #2d3a4f)`,
        }}
      >
        <span
          className="text-4xl font-bold tracking-tight text-white/85"
          aria-hidden
        >
          {initial}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2 flex flex-wrap gap-1.5">
          {game.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-md bg-surface-border/50 px-2 py-0.5 text-xs text-slate-400"
            >
              {tag}
            </span>
          ))}
        </div>
        <h3 className="text-lg font-semibold transition group-hover:text-accent">
          {game.title}
        </h3>
        <p className="mt-2 flex-1 text-sm text-slate-400 line-clamp-2">
          {game.description}
        </p>
        <p className="mt-3 text-xs text-slate-500">
          {game.players}人 · 約{game.durationMinutes}分
        </p>
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
              className="flex min-h-11 flex-1 items-center justify-center rounded-lg bg-accent py-2 text-center text-sm font-medium text-white transition hover:bg-accent-hover"
            >
              プレイ
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
