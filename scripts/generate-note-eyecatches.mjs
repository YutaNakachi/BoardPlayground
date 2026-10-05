/**
 * note 共通アイキャッチ（1280×670）
 * - ボドパッ！テーマカラー＋左：タイトル／サブタイトル／ロゴ、右：盤面を薄く
 *
 * Usage:
 *   node scripts/generate-note-eyecatches.mjs           # テクスチャ＋合成（要 npm run dev）
 *   node scripts/generate-note-eyecatches.mjs --compose-only  # 既存テクスチャのみ
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const OUT_DIR = path.join(ROOT, "docs/note/eyecatch");
const TEX_DIR = path.join(OUT_DIR, "textures");
const ENTRIES_PATH = path.join(OUT_DIR, "entries.json");
const BRAND = path.join(ROOT, "public/brand");
const BASE = process.argv.includes("--base")
  ? process.argv[process.argv.indexOf("--base") + 1]
  : "http://127.0.0.1:3000";
const COMPOSE_ONLY = process.argv.includes("--compose-only");
const W = 1280;
const H = 670;

const BOARD_CAPTURE = {
  ludo: 'div.mx-auto.w-full[class*="22rem"]',
  mancala: "div.mx-auto.grid.max-w-xl",
  "fox-hounds": '[aria-label="ウサギと猟犬の盤面"]',
  hex: 'div.relative:has(svg[aria-label="ヘックスの盤"])',
  "mini-shogi": "div.mx-auto.grid.max-w-xs.grid-cols-5.rounded-xl",
};

const HIDE_PLAY_CSS = `
  a[href="/"], h1.text-2xl, .badge-local, .badge-online, .badge-cpu,
  button:has-text("ルール"), button:has-text("はじめから"),
  .mb-6.flex.flex-wrap.items-start.justify-between.gap-4,
  div.rounded-2xl.border-2.px-4.py-4,
  div.space-y-6 > .flex.flex-col.items-center,
  div.space-y-6 > .text-center,
  div.space-y-5 > .flex.flex-wrap,
  p.text-center.text-xs.text-slate-500,
  section.rounded-xl.border.p-3 { display: none !important; }
`;

function loadEntries() {
  return JSON.parse(fs.readFileSync(ENTRIES_PATH, "utf8"));
}

function escapeHtml(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildFrameHtml(entry, textureFile) {
  const title = escapeHtml(entry.title);
  const subtitle = escapeHtml(entry.subtitle);
  const texUrl = textureFile ? `file://${textureFile}` : "";

  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="utf-8" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Zen+Kaku+Gothic+New:wght@700;900&display=swap" rel="stylesheet" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      width: ${W}px;
      height: ${H}px;
      overflow: hidden;
      font-family: "Hiragino Sans", "Yu Gothic UI", Meiryo, sans-serif;
      color: #f4f0f8;
      background-color: #0e0c14;
      background-image:
        radial-gradient(ellipse 90% 55% at 50% -15%, rgba(255, 92, 138, 0.16), transparent),
        radial-gradient(ellipse 55% 45% at 100% 0%, rgba(255, 179, 71, 0.1), transparent),
        radial-gradient(ellipse 40% 35% at 0% 100%, rgba(129, 140, 248, 0.08), transparent);
    }
    .frame { position: relative; width: 100%; height: 100%; }
    .board-fade {
      position: absolute;
      right: -4%;
      top: 50%;
      transform: translateY(-50%);
      width: 58%;
      height: 88%;
      background-image: url("${texUrl}");
      background-size: contain;
      background-position: center right;
      background-repeat: no-repeat;
      opacity: 0.1;
      -webkit-mask-image: linear-gradient(to left, #000 50%, transparent 92%);
      mask-image: linear-gradient(to left, #000 50%, transparent 92%);
      pointer-events: none;
    }
    .content {
      position: relative;
      z-index: 2;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      height: 100%;
      padding: 52px 64px 48px 72px;
      max-width: 58%;
    }
    .brand-row {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .brand-row img.symbol {
      width: 44px;
      height: 44px;
      border-radius: 10px;
    }
    .brand-row img.wordmark {
      height: 26px;
      width: auto;
      max-width: 200px;
      object-fit: contain;
      object-position: left center;
    }
    .title-block { margin-top: auto; margin-bottom: auto; padding-bottom: 12px; }
    .accent {
      width: 56px;
      height: 4px;
      border-radius: 999px;
      background: linear-gradient(90deg, #ff5c8a, #ffb347);
      margin-bottom: 22px;
    }
    h1 {
      font-family: "Zen Kaku Gothic New", "Hiragino Kaku Gothic ProN", "Yu Gothic UI", sans-serif;
      font-weight: 900;
      font-size: 84px;
      line-height: 1.08;
      letter-spacing: 0.04em;
      color: #fff;
      text-shadow: 0 2px 28px rgba(255, 92, 138, 0.12);
      -webkit-font-smoothing: antialiased;
    }
    .subtitle {
      margin-top: 20px;
      font-size: 26px;
      line-height: 1.55;
      font-weight: 500;
      color: #b8b2c4;
      max-width: 28em;
    }
    .site-en {
      font-size: 15px;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: #6b6478;
      font-weight: 500;
    }
  </style>
</head>
<body>
  <div class="frame">
    ${texUrl ? `<div class="board-fade" aria-hidden="true"></div>` : ""}
    <div class="content">
      <div class="brand-row">
        <img class="symbol" src="file://${path.join(BRAND, "logo-symbol.png")}" alt="" />
        <img class="wordmark" src="file://${path.join(BRAND, "logo-wordmark-light.png")}" alt="ボドパッ！" />
      </div>
      <div class="title-block">
        <div class="accent" aria-hidden="true"></div>
        <h1>${title}</h1>
        <p class="subtitle">${subtitle}</p>
      </div>
      <p class="site-en">Board Game Park</p>
    </div>
  </div>
</body>
</html>`;
}

async function captureTextures(browser) {
  fs.mkdirSync(TEX_DIR, { recursive: true });
  const context = await browser.newContext({
    viewport: { width: 900, height: 900 },
    deviceScaleFactor: 2,
    colorScheme: "dark",
  });
  const page = await context.newPage();

  for (const [slug, selector] of Object.entries(BOARD_CAPTURE)) {
    await page.goto(`${BASE}/play/${slug}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(200);
    await page.getByRole("button", { name: "ゲーム開始" }).click();
    await page.waitForTimeout(450);
    await page.addStyleTag({ content: HIDE_PLAY_CSS });
    const board = page.locator(selector).first();
    await board.waitFor({ state: "visible", timeout: 15000 });
    const out = path.join(TEX_DIR, `${slug}.png`);
    await board.screenshot({ path: out, type: "png" });
    console.log("texture", out);
  }
  await context.close();
}

async function composeAll(browser) {
  const entries = loadEntries();
  const context = await browser.newContext({
    viewport: { width: W, height: H },
    deviceScaleFactor: 1,
    colorScheme: "dark",
  });
  const page = await context.newPage();

  for (const entry of entries) {
    const tex = path.join(TEX_DIR, `${entry.slug}.png`);
    const html = buildFrameHtml(entry, fs.existsSync(tex) ? tex : null);
    const tmp = path.join(OUT_DIR, `_frame-${entry.slug}.html`);
    fs.writeFileSync(tmp, html);
    await page.goto(`file://${tmp}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(400);
    const out = path.join(OUT_DIR, `${entry.slug}.png`);
    await page.screenshot({ path: out, type: "png" });
    fs.unlinkSync(tmp);
    console.log("eyecatch", out);
  }
  await context.close();
}

async function main() {
  const browser = await chromium.launch();
  if (!COMPOSE_ONLY) {
    try {
      await captureTextures(browser);
    } catch (err) {
      await browser.close();
      console.error(
        "テクスチャ取得に失敗しました。`npm run dev` を起動するか、既存 textures で --compose-only を使ってください。"
      );
      throw err;
    }
  }
  await composeAll(browser);
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
