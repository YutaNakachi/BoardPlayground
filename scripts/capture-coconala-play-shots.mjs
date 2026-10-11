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
const CAPTION_H = 100;

/** slug, 掲載タイトル, 開始前の任意操作 */
/** 2・3枚目は手動スクショ。`compose-coconala-screenshot.mjs` で合成。 */
const GAMES = [
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
      <stop offset="18%" stop-color="#12101a" stop-opacity="0.88"/>
      <stop offset="100%" stop-color="#12101a" stop-opacity="0.98"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${CAPTION_H}" fill="url(#g)"/>
  <text x="${W / 2}" y="42" text-anchor="middle" fill="#f5f3ff" font-family="WenQuanYi Micro Hei" font-size="34" font-weight="700">${title}</text>
  <text x="${W / 2}" y="78" text-anchor="middle" fill="#c4b5fd" font-family="WenQuanYi Micro Hei" font-size="22">公開中のゲーム画面</text>
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
    document.querySelector("#main-content .mb-6")?.remove();
    const main = document.getElementById("main-content");
    if (main) {
      main.style.minHeight = "auto";
      main.style.flex = "none";
      main.style.padding = "0";
    }
    const shell = document.querySelector("#main-content .max-w-6xl");
    if (shell) {
      shell.style.paddingTop = "8px";
      shell.style.paddingBottom = "8px";
    }
  });
}

async function tightPlayClip(page) {
  return page.evaluate(() => {
    const play = document.querySelector("#main-content .max-w-6xl > *:last-child");
    if (!play) return null;

    const rects = [];
    const isTurnBanner = (el) => {
      const text = (el.textContent || "").replace(/\s+/g, "");
      return text.includes("手番") && el.classList.contains("rounded-2xl");
    };

    const visit = (el) => {
      for (const child of el.children) {
        const style = window.getComputedStyle(child);
        if (style.display === "none" || style.visibility === "hidden") continue;
        if (isTurnBanner(child)) continue;
        const r = child.getBoundingClientRect();
        if (r.width >= 40 && r.height >= 28) rects.push(r);
        visit(child);
      }
    };
    visit(play);

    if (rects.length === 0) {
      const r = play.getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, height: r.height };
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = 0;
    let maxY = 0;
    for (const r of rects) {
      minX = Math.min(minX, r.left);
      minY = Math.min(minY, r.top);
      maxX = Math.max(maxX, r.right);
      maxY = Math.max(maxY, r.bottom);
    }
    const pad = 6;
    return {
      x: Math.max(0, minX - pad),
      y: Math.max(0, minY - pad),
      width: maxX - minX + pad * 2,
      height: maxY - minY + pad * 2,
    };
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

  await trimSiteChrome(page);

  const clip = await tightPlayClip(page);
  if (!clip) throw new Error(`clip failed: ${game.slug}`);

  let shot = await page.screenshot({ type: "png", clip });
  const shotMeta = await sharp(shot).metadata();
  if (shotMeta.width / shotMeta.height > 1.35) {
    const cropW = Math.min(shotMeta.width, Math.floor(shotMeta.height * 1.05));
    const left = Math.floor((shotMeta.width - cropW) / 2);
    shot = await sharp(shot)
      .extract({ left, top: 0, width: cropW, height: shotMeta.height })
      .png()
      .toBuffer();
  }

  const maxContentH = H - CAPTION_H;
  const overlap = 40;
  let body = sharp(shot).resize(W, maxContentH, { fit: "inside" });
  let bodyBuf = await body.png().toBuffer();
  let { width: contentW, height: contentH } = await sharp(bodyBuf).metadata();

  if (contentH < maxContentH * 0.92) {
    bodyBuf = await sharp(shot)
      .resize(W, maxContentH, { fit: "cover", position: "centre" })
      .png()
      .toBuffer();
    contentW = W;
    contentH = maxContentH;
  }

  const bodyLeft = Math.max(0, Math.floor((W - contentW) / 2));
  const capBuf = await sharp(captionPng(game.title))
    .resize(W, CAPTION_H)
    .png()
    .toBuffer();
  const captionTop = Math.max(0, contentH - overlap);

  return sharp({
    create: {
      width: W,
      height: H,
      channels: 3,
      background: "#12101a",
    },
  })
    .composite([
      { input: bodyBuf, top: 0, left: bodyLeft },
      { input: capBuf, top: captionTop, left: 0 },
    ])
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

  let index = 4;
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
