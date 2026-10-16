import { sortCatalogGames } from "./catalog-sort";
import type { GameMeta } from "./games";

function assert(cond: boolean, message: string) {
  if (!cond) throw new Error(message);
}

function mini(partial: Partial<GameMeta> & { slug: string; title: string }): GameMeta {
  return {
    slug: partial.slug,
    title: partial.title,
    description: "",
    origin: "classic",
    players: "2",
    playersMin: 2,
    playersMax: 2,
    durationMinutes: 10,
    complexity: "normal",
    cpu: false,
    team: false,
    tags: ["ボード"],
    rulesSummary: [],
    status: "playable",
    listed: true,
    listedAt: partial.listedAt,
  };
}

const games = [
  mini({ slug: "a", title: "A", listedAt: "2024-01-01" }),
  mini({ slug: "b", title: "B", listedAt: "2026-01-01" }),
  mini({ slug: "c", title: "C" }),
];

const newestDesc = sortCatalogGames(games, "newest", "desc", {});
assert(newestDesc[0].slug === "b", "newest desc: latest date first");
assert(newestDesc[2].slug === "c", "newest desc: missing date last");

const newestAsc = sortCatalogGames(games, "newest", "asc", {});
assert(newestAsc[0].slug === "c" || newestAsc[0].slug === "a", "newest asc: oldest/missing first");

console.log("catalog-sort.test.ts: ok");
