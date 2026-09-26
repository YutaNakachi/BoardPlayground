import {
  DEFAULT_CATALOG_SORT,
  DEFAULT_CATALOG_SORT_ORDER,
  type CatalogSort,
  type CatalogSortOrder,
} from "@/lib/catalog-sort";
import {
  EMPTY_CATALOG_FILTERS,
  GAME_TAGS,
  type CatalogFilters,
  type DurationBucket,
  type GameComplexity,
  type GameOrigin,
  type GameTag,
  type PlayerBucket,
} from "@/lib/games";

const ORIGINS = new Set<GameOrigin>(["original", "classic", "tribute", "fiction"]);
const COMPLEXITIES = new Set<GameComplexity>(["easy", "normal", "hard"]);
const PLAYER_BUCKETS = new Set<PlayerBucket>(["solo", "two", "threePlus"]);
const DURATION_BUCKETS = new Set<DurationBucket>(["short", "medium", "long"]);
const TAGS = new Set<GameTag>(GAME_TAGS);
const SORTS = new Set<CatalogSort>(["play_count", "duration", "listed"]);

function splitList(value: string | null): string[] {
  if (!value) return [];
  return value.split(",").map((part) => part.trim()).filter(Boolean);
}

function pickMany<T extends string>(values: string[], allowed: Set<T>): T[] {
  return values.filter((value): value is T => allowed.has(value as T));
}

export function parseCatalogSearchParams(
  searchParams: URLSearchParams
): {
  filters: CatalogFilters;
  sort: CatalogSort;
  sortOrder: CatalogSortOrder;
} {
  const filters: CatalogFilters = {
    ...EMPTY_CATALOG_FILTERS,
    query: searchParams.get("q")?.trim() ?? "",
    origins: pickMany(splitList(searchParams.get("origin")), ORIGINS),
    complexities: pickMany(splitList(searchParams.get("complexity")), COMPLEXITIES),
    playerBuckets: pickMany(splitList(searchParams.get("players")), PLAYER_BUCKETS),
    durationBuckets: pickMany(splitList(searchParams.get("duration")), DURATION_BUCKETS),
    tags: pickMany(splitList(searchParams.get("tag")), TAGS),
    cpu: searchParams.get("cpu") === "1",
    team: searchParams.get("team") === "1",
    online: searchParams.get("online") === "1",
  };

  const sortParam = searchParams.get("sort");
  const sort: CatalogSort =
    sortParam && SORTS.has(sortParam as CatalogSort)
      ? (sortParam as CatalogSort)
      : DEFAULT_CATALOG_SORT;

  const orderParam = searchParams.get("order");
  const defaultOrder = DEFAULT_CATALOG_SORT_ORDER[sort];
  const sortOrder: CatalogSortOrder =
    orderParam === "asc" || orderParam === "desc" ? orderParam : defaultOrder;

  return { filters, sort, sortOrder };
}

function appendList(params: URLSearchParams, key: string, values: string[]) {
  if (values.length > 0) params.set(key, values.join(","));
}

export function buildCatalogSearchParams(
  filters: CatalogFilters,
  sort: CatalogSort,
  sortOrder: CatalogSortOrder
): string {
  const params = new URLSearchParams();
  const query = filters.query.trim();
  if (query) params.set("q", query);
  appendList(params, "origin", filters.origins);
  appendList(params, "complexity", filters.complexities);
  appendList(params, "players", filters.playerBuckets);
  appendList(params, "duration", filters.durationBuckets);
  appendList(params, "tag", filters.tags);
  if (filters.cpu) params.set("cpu", "1");
  if (filters.team) params.set("team", "1");
  if (filters.online) params.set("online", "1");

  if (sort !== DEFAULT_CATALOG_SORT) {
    params.set("sort", sort);
  }
  const defaultOrder = DEFAULT_CATALOG_SORT_ORDER[sort];
  if (sortOrder !== defaultOrder) {
    params.set("order", sortOrder);
  }

  return params.toString();
}

export function catalogParamsEqual(a: string, b: string): boolean {
  const normalize = (raw: string) => {
    const params = new URLSearchParams(raw);
    const entries = [...params.entries()].sort(([ka], [kb]) => ka.localeCompare(kb));
    return new URLSearchParams(entries).toString();
  };
  return normalize(a) === normalize(b);
}
