#!/usr/bin/env node
/**
 * Browser smoke tests for all playable games.
 * Run with dev server: npm run dev -- -p 3000
 * Then: node scripts/manual-game-browser-check.mjs
 */
import fs from "node:fs";
import path from "node:path";
import puppeteer from "puppeteer-core";

const BASE = process.env.PLAY_BASE_URL ?? "http://localhost:3000";
const ARTIFACTS = process.env.CURSOR_ARTIFACTS_DIR ?? "/opt/cursor/artifacts";
const CHROME = process.env.CHROME_PATH ?? "/usr/local/bin/google-chrome";

const GAMES = [
  "nebula-link",
  "star-trade",
  "chrono-split",
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

async function sleep(ms) {
  await new Promise((r) => setTimeout(r, ms));
}

async function clickIfVisible(page, selector, timeout = 2000) {
  try {
    const el = await page.waitForSelector(selector, { timeout, visible: true });
    if (el) {
      await el.click();
      return true;
    }
  } catch {
    /* not found */
  }
  return false;
}

async function clickButtonByText(page, text, timeout = 3000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    const clicked = await page.evaluate((t) => {
      const btn = Array.from(document.querySelectorAll("button")).find((b) =>
        b.textContent?.includes(t)
      );
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    }, text);
    if (clicked) return true;
    await sleep(200);
  }
  return false;
}

async function hasErrorOverlay(page) {
  const body = await page.evaluate(() => document.body.innerText);
  return (
    body.includes("Application error") ||
    body.includes("Unhandled Runtime Error") ||
    body.includes("Something went wrong")
  );
}

async function runGame(browser, slug) {
  const page = await browser.newPage();
  const url = `${BASE}/play/${slug}`;
  const result = { slug, url, status: "FAIL", steps: [], error: null };

  try {
    await page.setViewport({ width: 1280, height: 900 });
    const response = await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });
    result.steps.push(`load ${response?.status() ?? "?"}`);

    if (response && response.status() === 404) {
      result.status = "SKIP";
      result.error = "not listed in catalog (getGameBySlug returns 404)";
      result.steps.push("unlisted game — no public /play/ URL");
      return result;
    }

    if (response && response.status() >= 400) {
      throw new Error(`HTTP ${response.status()}`);
    }

    await page.waitForSelector("h1, h2, h3", { timeout: 10000 });
    result.steps.push("title visible");

    if (await hasErrorOverlay(page)) {
      throw new Error("error overlay on load");
    }

    const started = await clickButtonByText(page, "ゲーム開始");
    if (started) result.steps.push("clicked ゲーム開始");

    await sleep(400);

    if (await clickButtonByText(page, "手番を開始", 1500)) {
      result.steps.push("clicked 手番を開始");
      await sleep(400);
    }

    await interactGame(page, slug, result);

    if (await hasErrorOverlay(page)) {
      throw new Error("error overlay after interaction");
    }

    fs.mkdirSync(path.join(ARTIFACTS, "manual-game-tests"), { recursive: true });
    const shot = path.join(ARTIFACTS, "manual-game-tests", `${slug}.png`);
    await page.screenshot({ path: shot, fullPage: true });
    result.steps.push(`screenshot ${shot}`);

    result.status = "PASS";
  } catch (err) {
    result.error = err instanceof Error ? err.message : String(err);
    try {
      fs.mkdirSync(path.join(ARTIFACTS, "manual-game-tests"), { recursive: true });
      await page.screenshot({
        path: path.join(ARTIFACTS, "manual-game-tests", `${slug}-fail.png`),
        fullPage: true,
      });
    } catch {
      /* ignore */
    }
  } finally {
    await page.close();
  }

  return result;
}

async function interactGame(page, slug, result) {
  switch (slug) {
    case "nebula-link": {
      const core = await page.$('button[aria-label="星核"]');
      if (core) {
        await core.click();
        result.steps.push("core click attempted (should not end game)");
      }
      const cell = await page.$('button[aria-label^="空マス"]');
      if (cell) {
        await cell.click();
        result.steps.push("placed on empty cell");
      }
      break;
    }
    case "star-trade": {
      const draw = await clickButtonByText(page, "山札から1枚引く", 2000);
      if (draw) result.steps.push("drew card");
      break;
    }
    case "chrono-split": {
      const cards = await page.$$("section button");
      if (cards.length > 0) {
        await cards[0].click();
        result.steps.push("selected offer card");
      }
      break;
    }
    case "reversi":
    case "gomoku":
    case "hex":
    case "tic-tac-toe": {
      const cells = await page.$$('[role="button"], button.grid button, .grid button');
      const btn = cells[0] ?? (await page.$$("button"))[5];
      if (btn) {
        await btn.click();
        result.steps.push("board click");
      }
      break;
    }
    case "mancala": {
      await clickIfVisible(page, "button:not(.btn-game)", 2000);
      result.steps.push("pit click attempted");
      break;
    }
    case "checkers":
    case "fox-hounds":
    case "chess":
    case "shogi":
    case "mini-shogi": {
      const piece = await page.$("button[data-square], .grid button, button[aria-label]");
      if (piece) {
        await piece.click();
        result.steps.push("piece click");
      }
      break;
    }
    case "nine-mens-morris": {
      const point = await page.$("button");
      if (point) {
        await point.click();
        result.steps.push("point click");
      }
      break;
    }
    case "gravity-four": {
      const col = await page.$$("button");
      if (col[3]) {
        await col[3].click();
        result.steps.push("column drop");
      }
      break;
    }
    case "dots-and-boxes": {
      const edge = await page.$("button");
      if (edge) {
        await edge.click();
        result.steps.push("edge click");
      }
      break;
    }
    case "nim": {
      await clickButtonByText(page, "取る", 2000);
      result.steps.push("nim take attempted");
      break;
    }
    case "dominoes": {
      const tile = await page.$$("button");
      if (tile[2]) {
        await tile[2].click();
        result.steps.push("domino click");
      }
      break;
    }
    case "chinese-checkers": {
      const hole = await page.$$("button");
      if (hole[10]) {
        await hole[10].click();
        result.steps.push("select piece/hole");
      }
      break;
    }
    case "ludo":
    case "backgammon": {
      await clickButtonByText(page, "振", 2000);
      result.steps.push("roll attempted");
      break;
    }
    case "klondike":
    case "spider":
    case "mahjong-solitaire":
    case "slide-puzzle": {
      const card = await page.$$("button");
      if (card[0]) {
        await card[0].click();
        result.steps.push("solo interaction");
      }
      break;
    }
    default:
      result.steps.push("generic load only");
  }
}

async function main() {
  fs.mkdirSync(ARTIFACTS, { recursive: true });
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });

  const results = [];
  for (const slug of GAMES) {
    process.stdout.write(`Testing ${slug}... `);
    const result = await runGame(browser, slug);
    results.push(result);
    console.log(result.status, result.error ?? result.steps.join(" | "));
  }

  await browser.close();

  const summary = {
    testedAt: new Date().toISOString(),
    baseUrl: BASE,
    total: results.length,
    passed: results.filter((r) => r.status === "PASS").length,
    failed: results.filter((r) => r.status === "FAIL").length,
    results,
  };

  const out = path.join(ARTIFACTS, "manual-game-tests", "results.json");
  fs.writeFileSync(out, JSON.stringify(summary, null, 2));
  console.log("\n--- Summary ---");
  const passed = results.filter((r) => r.status === "PASS").length;
  const skipped = results.filter((r) => r.status === "SKIP").length;
  const failed = results.filter((r) => r.status === "FAIL").length;
  console.log(`PASS ${passed}/${results.length} SKIP ${skipped} FAIL ${failed}`);
  console.log(`Results: ${out}`);

  summary.passed = passed;
  summary.skipped = skipped;
  summary.failed = failed;
  fs.writeFileSync(out, JSON.stringify(summary, null, 2));

  if (failed > 0) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
