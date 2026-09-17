"use client";

import type { ReactNode } from "react";
import { FilterChip } from "@/components/FilterChip";
import {
  COMPLEXITY_LABEL,
  DURATION_BUCKET_LABEL,
  ORIGIN_LABEL,
  PLAYER_BUCKET_LABEL,
  catalogHasCpu,
  catalogHasTeam,
  getCatalogComplexities,
  getCatalogDurationBuckets,
  getCatalogOrigins,
  getCatalogPlayerBuckets,
  getCatalogTags,
  type CatalogFilters,
  type DurationBucket,
  type GameMeta,
  type GameOrigin,
  type GameTag,
  type PlayerBucket,
} from "@/lib/games";

type Props = {
  games: GameMeta[];
  filters: CatalogFilters;
  onChange: (filters: CatalogFilters) => void;
};

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
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );
}

export function CatalogFilterPanel({ games, filters, onChange }: Props) {
  const origins = getCatalogOrigins(games);
  const complexities = getCatalogComplexities(games);
  const playerBuckets = getCatalogPlayerBuckets(games);
  const durationBuckets = getCatalogDurationBuckets(games);
  const tags = getCatalogTags(games);
  const hasCpu = catalogHasCpu(games);
  const hasTeam = catalogHasTeam(games);

  function patch(partial: Partial<CatalogFilters>) {
    onChange({ ...filters, ...partial });
  }

  function toggleOrigin(origin: GameOrigin) {
    patch({
      origins: filters.origins.includes(origin)
        ? filters.origins.filter((item) => item !== origin)
        : [...filters.origins, origin],
    });
  }

  function toggleComplexity(complexity: CatalogFilters["complexities"][number]) {
    patch({
      complexities: filters.complexities.includes(complexity)
        ? filters.complexities.filter((item) => item !== complexity)
        : [...filters.complexities, complexity],
    });
  }

  function togglePlayerBucket(bucket: PlayerBucket) {
    patch({
      playerBuckets: filters.playerBuckets.includes(bucket)
        ? filters.playerBuckets.filter((item) => item !== bucket)
        : [...filters.playerBuckets, bucket],
    });
  }

  function toggleDurationBucket(bucket: DurationBucket) {
    patch({
      durationBuckets: filters.durationBuckets.includes(bucket)
        ? filters.durationBuckets.filter((item) => item !== bucket)
        : [...filters.durationBuckets, bucket],
    });
  }

  function toggleTag(tag: GameTag) {
    patch({
      tags: filters.tags.includes(tag)
        ? filters.tags.filter((item) => item !== tag)
        : [...filters.tags, tag],
    });
  }

  return (
    <div className="flex h-full flex-col">
      <h3 className="mb-4 text-sm font-semibold">絞り込み</h3>

      <div className="space-y-5" role="group" aria-label="条件で絞る">
        {origins.length > 0 ? (
          <FilterGroup label="系統">
            {origins.map((origin) => (
              <FilterChip
                key={origin}
                label={ORIGIN_LABEL[origin]}
                active={filters.origins.includes(origin)}
                onClick={() => toggleOrigin(origin)}
                layout="stack"
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
                layout="stack"
              />
            ))}
          </FilterGroup>
        ) : null}

        {playerBuckets.length > 0 ? (
          <FilterGroup label="人数">
            {playerBuckets.map((bucket) => (
              <FilterChip
                key={bucket}
                label={PLAYER_BUCKET_LABEL[bucket]}
                active={filters.playerBuckets.includes(bucket)}
                onClick={() => togglePlayerBucket(bucket)}
                layout="stack"
              />
            ))}
          </FilterGroup>
        ) : null}

        {durationBuckets.length > 0 ? (
          <FilterGroup label="時間">
            {durationBuckets.map((bucket) => (
              <FilterChip
                key={bucket}
                label={DURATION_BUCKET_LABEL[bucket]}
                active={filters.durationBuckets.includes(bucket)}
                onClick={() => toggleDurationBucket(bucket)}
                layout="stack"
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
                onClick={() => patch({ cpu: !filters.cpu })}
                layout="stack"
              />
            ) : null}
            {hasTeam ? (
              <FilterChip
                label="チーム可"
                active={filters.team}
                onClick={() => patch({ team: !filters.team })}
                layout="stack"
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
                layout="stack"
              />
            ))}
          </FilterGroup>
        ) : null}
      </div>
    </div>
  );
}
