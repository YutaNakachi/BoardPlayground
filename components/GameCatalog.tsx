"use client";

import { GameCard } from "@/components/GameCard";
import { useCatalogSidebar } from "@/components/CatalogSidebarContext";
import {
  ORIGIN_LABEL,
  countCatalogFilters,
  matchesCatalogFilters,
  type GameMeta,
  type GameOrigin,
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
  const { filters, clearFilters } = useCatalogSidebar();
  const activeCount = countCatalogFilters(filters);
  const filtered = games.filter((game) => matchesCatalogFilters(game, filters));

  return (
    <section>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-xl font-semibold">ゲーム一覧</h2>
          {activeCount > 0 ? (
            <button
              type="button"
              onClick={clearFilters}
              className="text-sm text-slate-500 transition hover:text-white"
            >
              条件をクリア（{activeCount}）
            </button>
          ) : null}
        </div>
        <span className="text-sm text-slate-500">{filtered.length} 本</span>
      </div>

      {filtered.length === 0 ? (
        <p className="text-slate-400">
          該当するゲームはありません。左上のメニューから条件を変えてください。
        </p>
      ) : (
        <div className="space-y-12">
          {ORIGIN_ORDER.map((origin) => {
            const group = filtered.filter((game) => game.origin === origin);
            if (group.length === 0) return null;
            return (
              <section key={origin}>
                <h3 className="mb-5 text-lg font-semibold">
                  {ORIGIN_LABEL[origin]}
                </h3>
                <GameGrid games={group} />
              </section>
            );
          })}
        </div>
      )}
    </section>
  );
}
