import type { GameMeta } from "@/lib/games";

export type CatalogSort = "play_count" | "duration" | "listed";
export type CatalogSortOrder = "asc" | "desc";

export const DEFAULT_CATALOG_SORT: CatalogSort = "play_count";

export const DEFAULT_CATALOG_SORT_ORDER: Record<CatalogSort, CatalogSortOrder> = {
  play_count: "desc",
  duration: "asc",
  listed: "asc",
};

export const CATALOG_SORT_OPTIONS: { key: CatalogSort; label: string }[] = [
  { key: "play_count", label: "プレイ回数" },
  { key: "duration", label: "プレイ時間" },
  { key: "listed", label: "掲載順" },
];

export const CATALOG_SORT_ORDER_LABEL: Record<CatalogSortOrder, string> = {
  asc: "昇順",
  desc: "降順",
};

export function sortCatalogGames(
  games: GameMeta[],
  sort: CatalogSort,
  order: CatalogSortOrder,
  counts: Record<string, number>
): GameMeta[] {
  const byTitle = (a: GameMeta, b: GameMeta) =>
    a.title.localeCompare(b.title, "ja");
  const direction = order === "asc" ? 1 : -1;

  const copy = [...games];

  switch (sort) {
    case "play_count":
      return copy.sort((a, b) => {
        const diff =
          direction * ((counts[a.slug] ?? 0) - (counts[b.slug] ?? 0));
        return diff !== 0 ? diff : byTitle(a, b);
      });
    case "duration":
      return copy.sort(
        (a, b) =>
          direction * (a.durationMinutes - b.durationMinutes) ||
          byTitle(a, b)
      );
    case "listed":
      return order === "desc" ? copy.reverse() : copy;
  }
}
