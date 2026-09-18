"use client";

import { FilterChip } from "@/components/FilterChip";
import { GameCard } from "@/components/GameCard";
import { useCatalogSidebar } from "@/components/CatalogSidebarContext";
import {
  countCatalogFilters,
  getCatalogTags,
  matchesCatalogFilters,
  type GameMeta,
  type GameTag,
} from "@/lib/games";
import { CATALOG_HEADING } from "@/lib/site";

type Props = { games: GameMeta[] };

export function GameCatalog({ games }: Props) {
  const { filters, setFilters, clearFilters } = useCatalogSidebar();
  const tags = getCatalogTags(games);
  const activeCount = countCatalogFilters(filters);
  const filtered = games.filter((game) => matchesCatalogFilters(game, filters));

  function toggleTag(tag: GameTag) {
    setFilters({
      ...filters,
      tags: filters.tags.includes(tag)
        ? filters.tags.filter((item) => item !== tag)
        : [...filters.tags, tag],
    });
  }

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h2 className="text-xl font-semibold">{CATALOG_HEADING}</h2>
        <span
          className="inline-flex min-w-9 items-center justify-center rounded-md bg-white/10 px-2.5 py-1 ring-1 ring-white/10"
          aria-label={`${filtered.length}件のゲーム`}
        >
          <span className="text-base font-bold tabular-nums text-accent">
            {filtered.length}
          </span>
        </span>
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

      {tags.length > 0 ? (
        <div
          className="mb-8 flex flex-wrap gap-2"
          role="group"
          aria-label="タグで絞る"
        >
          {tags.map((tag) => (
            <FilterChip
              key={tag}
              label={tag}
              active={filters.tags.includes(tag)}
              onClick={() => toggleTag(tag)}
            />
          ))}
        </div>
      ) : null}

      {filtered.length === 0 ? (
        <p className="text-slate-400">
          該当するゲームはありません。タグやメニューの条件を変えてください。
        </p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((game) => (
            <GameCard key={game.slug} game={game} />
          ))}
        </div>
      )}
    </section>
  );
}
