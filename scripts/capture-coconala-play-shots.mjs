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

/** slug, 掲載タイトル, 開始後の任意操作 */
const GAMES = [
  {
    slug: "nebula-link",
    title: "ネビュラ・リンク",
    tag: "オリジナル",
  },
  {
    slug: "senkai-senki",
    title: "砲塔戦棋",
    tag: "オリジナル",
  },
  {
    slug: "gomoku",
    title: "五目並べ",
    tag: "クラシック",
    afterStart: async (page) => {
      const cell = page.locator("button").filter({ hasText: /^$/ }).first();
      if (await cell.count()) {
        const box = page.locator('[class*="grid"]').first();
        if (await box.count()) {
          const b = await box.boundingBox();
          if (b) {
            await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2);
          }
        }
      }
    },
  },
];

function captionPng(title, tag) {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="120">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#12101a" stop-opacity="0"/>
      <stop offset="35%" stop-color="#12101a" stop-opacity="0.85"/>
      <stop offset="100%" stop-color="#12101a" stop-opacity="0.95"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="120" fill="url(#g)"/>
  <text x="${W / 2}" y="52" text-anchor="middle" fill="#f5f3ff" font-family="WenQuanYi Micro Hei" font-size="40" font-weight="700">${title}</text>
  <text x="${W / 2}" y="92" text-anchor="middle" fill="#c4b5fd" font-family="WenQuanYi Micro Hei" font-size="24">${tag} · ボドパッ！公開ゲームのプレイ画面</text>
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

async function captureGame(page, game) {
  const url = `http://localhost:3000/play/${game.slug}`;
  await page.goto(url, { waitUntil: "networkidle" });
  const start = page.getByRole("button", { name: "ゲーム開始" });
  if (await start.isVisible({ timeout: 8000 }).catch(() => false)) {
    await start.click();
    await page.waitForTimeout(600);
  }
  if (game.afterStart) {
    await game.afterStart(page);
    await page.waitForTimeout(400);
  }
  const shot = await page.screenshot({ type: "png", fullPage: false });
  const base = await sharp(shot)
    .resize(W, H, { fit: "cover", position: "centre" })
    .png()
    .toBuffer();
  const cap = captionPng(game.title, game.tag);
  const capBuf = await sharp(cap).resize(W, 120).png().toBuffer();
  return sharp(base)
    .composite([{ input: capBuf, top: H - 120, left: 0 }])
    .jpeg({ quality: 90, mozjpeg: true })
    .toBuffer();
}

async function main() {
  mkdirSync(outDir, { recursive: true });
  mkdirSync(artifactsDir, { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1280, height: 900 },
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
