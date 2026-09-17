"use client";

import { useEffect, useState } from "react";
import { CatalogFilterPanel } from "@/components/CatalogFilterPanel";
import { GameCard } from "@/components/GameCard";
import {
  EMPTY_CATALOG_FILTERS,
  ORIGIN_LABEL,
  countCatalogFilters,
  matchesCatalogFilters,
  type CatalogFilters,
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
          : "grid gap-6 sm:grid-cols-2 xl:grid-cols-3"
      }
    >
      {games.map((game) => (
        <GameCard key={game.slug} game={game} />
      ))}
    </div>
  );
}

export function GameCatalog({ games }: Props) {
  const [filters, setFilters] = useState<CatalogFilters>(EMPTY_CATALOG_FILTERS);
  const [open, setOpen] = useState(false);
  const activeCount = countCatalogFilters(filters);
  const filtered = games.filter((game) => matchesCatalogFilters(game, filters));

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <section>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-xl font-semibold">ゲーム一覧</h2>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-surface-border bg-surface-raised px-3 text-sm text-slate-300 transition hover:text-white"
            aria-expanded={open}
            aria-controls="catalog-filters"
          >
            絞り込み
            {activeCount > 0 ? (
              <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-white">
                {activeCount}
              </span>
            ) : null}
          </button>
          {activeCount > 0 ? (
            <button
              type="button"
              onClick={() => setFilters(EMPTY_CATALOG_FILTERS)}
              className="text-sm text-slate-500 transition hover:text-white"
            >
              条件をクリア
            </button>
          ) : null}
        </div>
        <span className="text-sm text-slate-500">{filtered.length} 本</span>
      </div>

      <div className="flex gap-8">
        {open ? (
          <>
            <button
              type="button"
              className="fixed inset-0 z-40 bg-black/60 lg:hidden"
              aria-label="絞り込みを閉じる"
              onClick={() => setOpen(false)}
            />
            <aside
              id="catalog-filters"
              className="fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col border-r border-surface-border bg-surface p-4 shadow-xl lg:static lg:z-auto lg:max-w-none lg:w-56 lg:shrink-0 lg:rounded-2xl lg:border lg:shadow-none"
            >
              <CatalogFilterPanel
                games={games}
                filters={filters}
                onChange={setFilters}
                onClose={() => setOpen(false)}
              />
            </aside>
          </>
        ) : null}

        <div className="min-w-0 flex-1">
          {filtered.length === 0 ? (
            <p className="text-slate-400">
              該当するゲームはありません。条件を変えてやり直してください。
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
        </div>
      </div>
    </section>
  );
}
