"use client";

import { useMemo } from "react";
import { CatalogSortSelect } from "@/components/CatalogSortSelect";
import { FilterChip } from "@/components/FilterChip";
import { GameCard } from "@/components/GameCard";
import { usePlayStats } from "@/components/PlayStatsProvider";
import { useCatalogSidebar } from "@/components/CatalogSidebarContext";
import { sortCatalogGames } from "@/lib/catalog-sort";
import {
  countCatalogFilters,
  getCatalogTags,
  matchesCatalogFilters,
  type GameMeta,
  type GameTag,
} from "@/lib/games";
import { CATALOG_HEADING } from "@/lib/site";

type Props = {
  games: GameMeta[];
  initialPlayCounts?: Record<string, number>;
};

export function GameCatalog({ games, initialPlayCounts = {} }: Props) {
  const {
    filters,
    setFilters,
    clearFilters,
    sort,
    setSort,
    sortOrder,
    toggleSortOrder,
  } = useCatalogSidebar();
  const { counts: clientCounts } = usePlayStats();
  const tags = getCatalogTags(games);
  const activeCount = countCatalogFilters(filters);

  const playCounts = useMemo(() => {
    const merged = { ...initialPlayCounts };
    for (const [slug, count] of Object.entries(clientCounts)) {
      if (count != null) merged[slug] = count;
    }
    return merged;
  }, [initialPlayCounts, clientCounts]);

  const displayed = useMemo(() => {
    const filtered = games.filter((game) => matchesCatalogFilters(game, filters));
    return sortCatalogGames(filtered, sort, sortOrder, playCounts);
  }, [games, filters, sort, sortOrder, playCounts]);

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
          aria-label={`${displayed.length}件のゲーム`}
        >
          <span className="text-base font-bold tabular-nums text-accent">
            {displayed.length}
          </span>
        </span>
        <CatalogSortSelect
          value={sort}
          order={sortOrder}
          onChange={setSort}
          onToggleOrder={toggleSortOrder}
        />
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
          className="mb-8 flex flex-wrap items-center gap-2"
          role="group"
          aria-label="タグで絞る"
        >
          <span className="text-sm text-slate-500">タグ</span>
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

      {displayed.length === 0 ? (
        <p className="text-slate-400">
          該当するゲームはありません。タグやメニューの条件を変えてください。
        </p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {displayed.map((game) => (
            <GameCard
              key={game.slug}
              game={game}
              initialPlayCount={playCounts[game.slug]}
            />
          ))}
        </div>
      )}
    </section>
  );
}
