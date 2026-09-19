import type { GameMeta } from "@/lib/games";

export type CatalogSort = "play_count" | "title" | "duration" | "listed";

export const DEFAULT_CATALOG_SORT: CatalogSort = "play_count";

export const CATALOG_SORT_OPTIONS: { key: CatalogSort; label: string }[] = [
  { key: "play_count", label: "プレイ回数" },
  { key: "title", label: "名前" },
  { key: "duration", label: "プレイ時間" },
  { key: "listed", label: "掲載順" },
];

export function sortCatalogGames(
  games: GameMeta[],
  sort: CatalogSort,
  counts: Record<string, number>
): GameMeta[] {
  const byTitle = (a: GameMeta, b: GameMeta) =>
    a.title.localeCompare(b.title, "ja");

  const copy = [...games];

  switch (sort) {
    case "play_count":
      return copy.sort((a, b) => {
        const diff = (counts[b.slug] ?? 0) - (counts[a.slug] ?? 0);
        return diff !== 0 ? diff : byTitle(a, b);
      });
    case "title":
      return copy.sort(byTitle);
    case "duration":
      return copy.sort(
        (a, b) =>
          a.durationMinutes - b.durationMinutes || byTitle(a, b)
      );
    case "listed":
      return copy;
  }
}
