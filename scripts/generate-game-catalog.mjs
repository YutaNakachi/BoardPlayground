import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import {
  COMPLEXITY_LABEL,
  getAllRegisteredGames,
  ORIGIN_LABEL,
} from "../lib/games.ts";
import { isOnlineGame } from "../lib/online/types.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outPath = path.join(root, "docs", "game-catalog.md");

function escCell(value) {
  return value.replace(/\|/g, "\\|").replace(/\n/g, " ");
}

function row(game) {
  const listed = game.listed ? "はい" : "いいえ";
  const cpu = game.cpu ? "はい" : "—";
  const online = isOnlineGame(game.slug) ? "はい" : "—";
  const tags = game.tags.join("・");
  return `| ${listed} | ${escCell(game.title)} | \`${game.slug}\` | ${ORIGIN_LABEL[game.origin]} | ${game.players} | ${game.durationMinutes} | ${COMPLEXITY_LABEL[game.complexity]} | ${cpu} | ${online} | ${escCell(tags)} | ${game.status} |`;
}

const all = [...getAllRegisteredGames()];
const listed = all.filter((g) => g.listed);
const unlisted = all.filter((g) => !g.listed);
const generatedAt = new Date().toISOString().slice(0, 10);

const lines = [
  "# ゲーム掲載一覧（管理用）",
  "",
  "正本は [`lib/games.ts`](../lib/games.ts) です。このファイルは次で再生成できます。",
  "",
  "```bash",
  "npm run catalog:doc",
  "```",
  "",
  `最終生成: ${generatedAt} · 登録 ${all.length} 本 · 掲載 ${listed.length} 本 · 非掲載 ${unlisted.length} 本`,
  "",
  "## 掲載中（サイト一覧に出る）",
  "",
  "| 掲載 | タイトル | slug | 系統 | 人数 | 分 | 難易度 | CPU | オンライン | タグ | status |",
  "| --- | --- | --- | --- | --- | ---: | --- | --- | --- | --- | --- |",
  ...listed.map(row),
  "",
];

if (unlisted.length > 0) {
  lines.push("## 非掲載（実装はあるが一覧に出ない）", "");
  lines.push(
    "| 掲載 | タイトル | slug | 系統 | 人数 | 分 | 難易度 | CPU | オンライン | タグ | status |",
    "| --- | --- | --- | --- | --- | ---: | --- | --- | --- | --- | --- |",
    ...unlisted.map(row),
    ""
  );
}

lines.push(
  "## 関連",
  "",
  "- ルール文: `games/{slug}/rules.md`",
  "- プレイ画面: `lib/play-registry.ts`",
  "- Agent 初回プロンプト: [`docs/agent-prompts.md`](./agent-prompts.md)",
  ""
);

writeFileSync(outPath, lines.join("\n"), "utf8");
console.log(`Wrote ${outPath} (${listed.length} listed, ${unlisted.length} unlisted)`);
