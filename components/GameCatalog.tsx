"use client";

import { useMemo, useState } from "react";
import { GameCard } from "@/components/GameCard";
import {
  ORIGIN_LABEL,
  getCatalogTags,
  type GameMeta,
  type GameOrigin,
  type GameTag,
} from "@/lib/games";

type Props = { games: GameMeta[] };

const ORIGIN_ORDER: GameOrigin[] = ["original", "classic"];

function GameGrid({ games }: { games: GameMeta[] }) {
  return (
    <div
      className={
        games.length === 1
          ? "max-w-md"
          : "grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
      }
    >
      {games.map((game) => (
        <GameCard key={game.slug} game={game} />
      ))}
    </div>
  );
}

export function GameCatalog({ games }: Props) {
  const [selected, setSelected] = useState<GameTag[]>([]);
  const chips = getCatalogTags(games);

  const filtered = useMemo(
    () =>
      games.filter((game) => selected.every((tag) => game.tags.includes(tag))),
    [games, selected]
  );

  function toggle(tag: GameTag) {
    setSelected((current) =>
      current.includes(tag)
        ? current.filter((item) => item !== tag)
        : [...current, tag]
    );
  }

  return (
    <section>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <h2 className="text-xl font-semibold">ゲーム一覧</h2>
        <span className="text-sm text-slate-500">{filtered.length} 本</span>
      </div>

      {chips.length > 0 ? (
        <div className="mb-10 flex flex-wrap gap-2" role="group" aria-label="タグで絞る">
          {chips.map((tag) => {
            const active = selected.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                aria-pressed={active}
                onClick={() => toggle(tag)}
                className={`min-h-11 rounded-full px-4 text-sm transition ${
                  active
                    ? "bg-accent font-medium text-white"
                    : "bg-surface-raised text-slate-300 ring-1 ring-surface-border hover:text-white"
                }`}
              >
                {tag}
              </button>
            );
          })}
        </div>
      ) : null}

      {filtered.length === 0 ? (
        <p className="text-slate-400">該当するゲームはありません。チップを外してやり直してください。</p>
      ) : (
        <div className="space-y-12">
          {ORIGIN_ORDER.map((origin) => {
            const group = filtered.filter((game) => game.origin === origin);
            if (group.length === 0) return null;
            return (
              <section key={origin}>
                <h3 className="mb-5 text-lg font-semibold">{ORIGIN_LABEL[origin]}</h3>
                <GameGrid games={group} />
              </section>
            );
          })}
        </div>
      )}
    </section>
  );
}
