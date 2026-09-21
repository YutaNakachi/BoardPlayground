import assert from "node:assert/strict";
import { aggregateListedPeriodRanking } from "../lib/stats/ranking-data.ts";

const listedSlugs = new Set(["reversi", "gomoku"]);
const slugToTitle = new Map([
  ["reversi", "リバーシ"],
  ["gomoku", "五目並べ"],
]);

const ranking = aggregateListedPeriodRanking(
  [
    { game_slug: "klondike", play_count: 10 },
    { game_slug: "reversi", play_count: 3 },
    { game_slug: "reversi", play_count: 2 },
    { game_slug: "gomoku", play_count: 4 },
  ],
  listedSlugs,
  slugToTitle
);

assert.deepEqual(ranking, [
  { rank: 1, slug: "reversi", title: "リバーシ", playCount: 5 },
  { rank: 2, slug: "gomoku", title: "五目並べ", playCount: 4 },
]);

console.log("check-ranking-listed: ok");
