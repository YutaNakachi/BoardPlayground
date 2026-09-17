"use client";

import { useState, type ReactNode } from "react";
import { FilterChip } from "@/components/FilterChip";
import { GameCard } from "@/components/GameCard";
import {
  COMPLEXITY_LABEL,
  ORIGIN_LABEL,
  catalogHasCpu,
  catalogHasTeam,
  getCatalogComplexities,
  getCatalogDurations,
  getCatalogOrigins,
  getCatalogPlayerLabels,
  getCatalogTags,
  matchesCatalogFilters,
  type CatalogFilters,
  type GameMeta,
  type GameOrigin,
  type GameTag,
} from "@/lib/games";

type Props = { games: GameMeta[] };

const ORIGIN_ORDER: GameOrigin[] = ["original", "classic"];

const EMPTY_FILTERS: CatalogFilters = {
  origins: [],
  complexities: [],
  players: [],
  durations: [],
  cpu: false,
  team: false,
  tags: [],
};

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

function FilterGroup({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-medium text-slate-500">{label}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

export function GameCatalog({ games }: Props) {
  const [filters, setFilters] = useState<CatalogFilters>(EMPTY_FILTERS);

  const origins = getCatalogOrigins(games);
  const complexities = getCatalogComplexities(games);
  const playerLabels = getCatalogPlayerLabels(games);
  const durations = getCatalogDurations(games);
  const tags = getCatalogTags(games);
  const hasCpu = catalogHasCpu(games);
  const hasTeam = catalogHasTeam(games);

  const filtered = games.filter((game) => matchesCatalogFilters(game, filters));

  function toggleOrigin(origin: GameOrigin) {
    setFilters((current) => ({
      ...current,
      origins: current.origins.includes(origin)
        ? current.origins.filter((item) => item !== origin)
        : [...current.origins, origin],
    }));
  }

  function toggleComplexity(complexity: CatalogFilters["complexities"][number]) {
    setFilters((current) => ({
      ...current,
      complexities: current.complexities.includes(complexity)
        ? current.complexities.filter((item) => item !== complexity)
        : [...current.complexities, complexity],
    }));
  }

  function togglePlayers(players: string) {
    setFilters((current) => ({
      ...current,
      players: current.players.includes(players)
        ? current.players.filter((item) => item !== players)
        : [...current.players, players],
    }));
  }

  function toggleDuration(duration: number) {
    setFilters((current) => ({
      ...current,
      durations: current.durations.includes(duration)
        ? current.durations.filter((item) => item !== duration)
        : [...current.durations, duration],
    }));
  }

  function toggleTag(tag: GameTag) {
    setFilters((current) => ({
      ...current,
      tags: current.tags.includes(tag)
        ? current.tags.filter((item) => item !== tag)
        : [...current.tags, tag],
    }));
  }

  const hasFilterGroups =
    origins.length > 0 ||
    complexities.length > 0 ||
    playerLabels.length > 0 ||
    durations.length > 0 ||
    hasCpu ||
    hasTeam ||
    tags.length > 0;

  return (
    <section>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <h2 className="text-xl font-semibold">ゲーム一覧</h2>
        <span className="text-sm text-slate-500">{filtered.length} 本</span>
      </div>

      {hasFilterGroups ? (
        <div
          className="mb-10 space-y-4"
          role="group"
          aria-label="条件で絞る"
        >
          {origins.length > 0 ? (
            <FilterGroup label="系統">
              {origins.map((origin) => (
                <FilterChip
                  key={origin}
                  label={ORIGIN_LABEL[origin]}
                  active={filters.origins.includes(origin)}
                  onClick={() => toggleOrigin(origin)}
                />
              ))}
            </FilterGroup>
          ) : null}

          {complexities.length > 0 ? (
            <FilterGroup label="難易度">
              {complexities.map((complexity) => (
                <FilterChip
                  key={complexity}
                  label={COMPLEXITY_LABEL[complexity]}
                  active={filters.complexities.includes(complexity)}
                  onClick={() => toggleComplexity(complexity)}
                />
              ))}
            </FilterGroup>
          ) : null}

          {playerLabels.length > 0 ? (
            <FilterGroup label="人数">
              {playerLabels.map((players) => (
                <FilterChip
                  key={players}
                  label={`${players}人`}
                  active={filters.players.includes(players)}
                  onClick={() => togglePlayers(players)}
                />
              ))}
            </FilterGroup>
          ) : null}

          {durations.length > 0 ? (
            <FilterGroup label="時間">
              {durations.map((duration) => (
                <FilterChip
                  key={duration}
                  label={`約${duration}分`}
                  active={filters.durations.includes(duration)}
                  onClick={() => toggleDuration(duration)}
                />
              ))}
            </FilterGroup>
          ) : null}

          {hasCpu || hasTeam ? (
            <FilterGroup label="その他">
              {hasCpu ? (
                <FilterChip
                  label="CPUあり"
                  active={filters.cpu}
                  onClick={() =>
                    setFilters((current) => ({ ...current, cpu: !current.cpu }))
                  }
                />
              ) : null}
              {hasTeam ? (
                <FilterChip
                  label="チーム可"
                  active={filters.team}
                  onClick={() =>
                    setFilters((current) => ({ ...current, team: !current.team }))
                  }
                />
              ) : null}
            </FilterGroup>
          ) : null}

          {tags.length > 0 ? (
            <FilterGroup label="タグ">
              {tags.map((tag) => (
                <FilterChip
                  key={tag}
                  label={tag}
                  active={filters.tags.includes(tag)}
                  onClick={() => toggleTag(tag)}
                />
              ))}
            </FilterGroup>
          ) : null}
        </div>
      ) : null}

      {filtered.length === 0 ? (
        <p className="text-slate-400">
          該当するゲームはありません。チップを外してやり直してください。
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
