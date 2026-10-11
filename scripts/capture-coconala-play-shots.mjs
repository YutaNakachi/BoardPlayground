/**
 * 公開中ゲームのプレイ画面をキャプチャし、ココナラ用 6:5 JPEG を出力する。
 * 前提: `npm run dev` が localhost:3000 で起動済み。
 * 依存: playwright, sharp, @resvg/resvg-js
 */
import { chromium } from "playwright";
import sharp from "sharp";
import { Resvg } from "@resvg/resvg-js";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const outDir = join(root, "docs/coconala");
const artifactsDir = "/opt/cursor/artifacts";
const fontPath = "/usr/share/fonts/truetype/wqy/wqy-microhei.ttc";

const W = 1220;
const H = 1016;
const CAPTION_H = 120;

/** slug, 掲載タイトル, 開始前の任意操作 */
const GAMES = [
  { slug: "senkai-senki", title: "砲塔戦棋" },
  { slug: "mancala", title: "マンカラ・カラハ" },
  {
    slug: "ludo",
    title: "ルドー",
    beforeStart: async (page) => {
      const four = page.getByRole("button", { name: "4人" });
      if (await four.isVisible().catch(() => false)) {
        await four.click();
      }
    },
  },
];

function captionPng(title) {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${CAPTION_H}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#12101a" stop-opacity="0"/>
      <stop offset="35%" stop-color="#12101a" stop-opacity="0.85"/>
      <stop offset="100%" stop-color="#12101a" stop-opacity="0.95"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${CAPTION_H}" fill="url(#g)"/>
  <text x="${W / 2}" y="48" text-anchor="middle" fill="#f5f3ff" font-family="WenQuanYi Micro Hei" font-size="40" font-weight="700">${title}</text>
  <text x="${W / 2}" y="92" text-anchor="middle" fill="#c4b5fd" font-family="WenQuanYi Micro Hei" font-size="26">公開中のゲーム画面</text>
</svg>`;
  const resvg = new Resvg(svg, {
    font: {
      fontFiles: [fontPath],
      loadSystemFonts: true,
      defaultFontFamily: "WenQuanYi Micro Hei",
    },
  });
  return resvg.render().asPng();
}

async function trimSiteChrome(page) {
  await page.evaluate(() => {
    document.querySelector("header")?.remove();
    document.querySelector("footer")?.remove();
  });
}

async function captureGame(page, game) {
  const url = `http://localhost:3000/play/${game.slug}`;
  await page.goto(url, { waitUntil: "networkidle" });
  await trimSiteChrome(page);
  await page.waitForTimeout(200);

  if (game.beforeStart) {
    await game.beforeStart(page);
  }

  const start = page.getByRole("button", { name: "ゲーム開始" });
  if (await start.isVisible({ timeout: 8000 }).catch(() => false)) {
    await start.click();
    await page.waitForTimeout(700);
  }

  if (game.afterStart) {
    await game.afterStart(page);
    await page.waitForTimeout(400);
  }

  const main = page.locator("#main-content");
  await main.waitFor({ state: "visible" });
  const shot = await main.screenshot({ type: "png" });
  const contentH = H - CAPTION_H;
  const base = await sharp(shot)
    .resize(W, contentH, { fit: "cover", position: "centre" })
    .png()
    .toBuffer();
  const capBuf = await sharp(captionPng(game.title))
    .resize(W, CAPTION_H)
    .png()
    .toBuffer();
  return sharp({
    create: {
      width: W,
      height: H,
      channels: 3,
      background: "#12101a",
    },
  })
    .composite([
      { input: base, top: 0, left: 0 },
      { input: capBuf, top: contentH, left: 0 },
    ])
    .jpeg({ quality: 90, mozjpeg: true })
    .toBuffer();
}

async function main() {
  mkdirSync(outDir, { recursive: true });
  mkdirSync(artifactsDir, { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1280, height: 960 },
    deviceScaleFactor: 2,
  });

  let index = 2;
  for (const game of GAMES) {
    const buf = await captureGame(page, game);
    const name = `thumbnail-0${index}.jpg`;
    const repoPath = join(outDir, name);
    writeFileSync(repoPath, buf);
    writeFileSync(join(artifactsDir, `coconala-${name}`), buf);
    console.log("wrote", repoPath, game.slug);
    index += 1;
  }

  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
