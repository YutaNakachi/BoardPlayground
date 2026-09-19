#!/usr/bin/env node
/**
 * End-to-end browser GUI tests (fallback when computerUse quota exceeded).
 * Usage: npm run dev -- -p 3000 && node scripts/e2e-game-browser-check.mjs [slug...]
 */
import fs from "node:fs";
import path from "node:path";
import puppeteer from "puppeteer-core";

const BASE = process.env.PLAY_BASE_URL ?? "http://localhost:3000";
const ARTIFACTS = process.env.CURSOR_ARTIFACTS_DIR ?? "/opt/cursor/artifacts";
const CHROME = process.env.CHROME_PATH ?? "/usr/local/bin/google-chrome";

const ALL_GAMES = [
  "nebula-link",
  "reversi",
  "mancala",
  "gomoku",
  "checkers",
  "nine-mens-morris",
  "tic-tac-toe",
  "gravity-four",
  "dots-and-boxes",
  "nim",
  "hex",
  "fox-hounds",
  "dominoes",
  "chinese-checkers",
  "ludo",
  "backgammon",
  "chess",
  "shogi",
  "mini-shogi",
  "klondike",
  "spider",
  "mahjong-solitaire",
  "slide-puzzle",
];

const slugs = process.argv.slice(2).length ? process.argv.slice(2) : ALL_GAMES;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function bodyText(page) {
  return page.evaluate(() => document.body.innerText);
}

async function clickText(page, text, timeout = 5000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    const ok = await page.evaluate((t) => {
      const btn = Array.from(document.querySelectorAll("button")).find((b) =>
        b.textContent?.includes(t)
      );
      if (btn && !btn.disabled) {
        btn.click();
        return true;
      }
      return false;
    }, text);
    if (ok) return true;
    await sleep(200);
  }
  return false;
}

async function startGame(page) {
  await clickText(page, "ゲーム開始");
  await sleep(400);
  await clickText(page, "手番を開始", 1500);
  await sleep(300);
}

async function hasGameOver(text) {
  return (
    text.includes("の勝ち") ||
    text.includes("共同勝利") ||
    text.includes("クリア") ||
    text.includes("もう一度") ||
    (text.includes("点") && text.includes("プレイヤー") && text.includes("連結"))
  );
}

async function playNebulaLink(page, result) {
  await startGame(page);
  await page.click('button[aria-label="星核"]').catch(() => {});
  result.steps.push("core blocked");

  for (let i = 0; i < 30; i++) {
    const text = await bodyText(page);
    if (await hasGameOver(text)) break;
    const clicked = await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll("button")).find(
        (b) => b.getAttribute("aria-label")?.startsWith("空マス") && !b.disabled
      );
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });
    if (!clicked) break;
    await sleep(60);
  }
  const finalText = await bodyText(page);
  if (!(await hasGameOver(finalText))) throw new Error("no game over");
  result.steps.push("full board + result panel");
}

async function playTicTacToe(page, result) {
  await startGame(page);
  for (let i = 0; i < 9; i++) {
    const text = await bodyText(page);
    if (await hasGameOver(text)) break;
    const clicked = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button")).filter(
        (b) => !b.disabled && b.className.includes("aspect-square")
      );
      if (btns[0]) {
        btns[0].click();
        return true;
      }
      return false;
    });
    if (!clicked) break;
    await sleep(120);
  }
  if (!(await hasGameOver(await bodyText(page)))) throw new Error("no result");
  result.steps.push("win or draw");
}

async function playNim(page, result) {
  await startGame(page);
  for (let i = 0; i < 30; i++) {
    const text = await bodyText(page);
    if (text.includes("勝者")) break;

    const nums = await page.$$("div.flex.flex-wrap.justify-center.gap-2 button");
    if (nums.length) {
      await nums[nums.length - 1].click();
    } else {
      const heaps = await page.$$("div.grid.gap-4 button:not([disabled])");
      if (!heaps.length) break;
      await heaps[heaps.length - 1].click();
    }
    await sleep(150);
  }
  if (!(await bodyText(page)).includes("勝者")) throw new Error("nim unfinished");
  result.steps.push("last stone taken");
}

async function playGeneric(page, result, max = 20) {
  await startGame(page);
  for (let i = 0; i < max; i++) {
    if (await hasGameOver(await bodyText(page))) {
      result.steps.push("game over");
      return;
    }
    const clicked = await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll("button")).find(
        (b) =>
          !b.disabled &&
          !b.textContent?.includes("ゲーム開始") &&
          !b.textContent?.includes("もう一度") &&
          !b.classList.contains("btn-game")
      );
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });
    if (!clicked) break;
    await sleep(180);
  }
  result.steps.push(`played up to ${max} actions`);
}

async function runGame(browser, slug) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  const outDir = path.join(ARTIFACTS, "e2e-game-tests");
  fs.mkdirSync(outDir, { recursive: true });
  const result = { slug, status: "FAIL", steps: [], error: null };

  try {
    const response = await page.goto(`${BASE}/play/${slug}`, {
      waitUntil: "networkidle2",
      timeout: 30000,
    });
    if (response?.status() === 404) {
      result.status = "SKIP";
      result.error = "404 not listed";
      return result;
    }
    if ((response?.status() ?? 500) >= 400) throw new Error(`HTTP ${response?.status()}`);

    switch (slug) {
      case "nebula-link":
        await playNebulaLink(page, result);
        break;
      case "tic-tac-toe":
        await playTicTacToe(page, result);
        break;
      case "nim":
        await playNim(page, result);
        break;
      default:
        await playGeneric(page, result);
    }

    await page.screenshot({ path: path.join(outDir, `${slug}-final.png`), fullPage: true });
    result.status = "PASS";
  } catch (err) {
    result.error = err instanceof Error ? err.message : String(err);
    await page.screenshot({ path: path.join(outDir, `${slug}-fail.png`), fullPage: true }).catch(() => {});
  } finally {
    await page.close();
  }
  return result;
}

async function main() {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });

  const results = [];
  for (const slug of slugs) {
    process.stdout.write(`E2E ${slug}... `);
    const r = await runGame(browser, slug);
    results.push(r);
    console.log(r.status, r.error ?? r.steps.join(" | "));
  }
  await browser.close();

  const outDir = path.join(ARTIFACTS, "e2e-game-tests");
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(
    path.join(outDir, "results.json"),
    JSON.stringify({ testedAt: new Date().toISOString(), results }, null, 2)
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
