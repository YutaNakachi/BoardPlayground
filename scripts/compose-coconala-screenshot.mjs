/**
 * 手元のプレイ画面スクショをココナラ用 6:5 JPEG にする。
 * 用法: node scripts/compose-coconala-screenshot.mjs <入力PNG> <ゲーム名> <出力jpg>
 */
import sharp from "sharp";
import { Resvg } from "@resvg/resvg-js";
import { writeFileSync } from "node:fs";

const W = 1220;
const H = 1016;
const CAPTION_H = 100;
const overlap = 40;
const fontPath = "/usr/share/fonts/truetype/wqy/wqy-microhei.ttc";

const [input, title, output] = process.argv.slice(2);
if (!input || !title || !output) {
  console.error(
    "usage: node scripts/compose-coconala-screenshot.mjs <in.png> <title> <out.jpg>"
  );
  process.exit(1);
}

function captionPng() {
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
  return new Resvg(svg, {
    font: {
      fontFiles: [fontPath],
      loadSystemFonts: true,
      defaultFontFamily: "WenQuanYi Micro Hei",
    },
  }).render().asPng();
}

const shot = await sharp(input).trim({ threshold: 12 }).png().toBuffer();
const maxContentH = H - CAPTION_H;
let bodyBuf = await sharp(shot)
  .resize(W, maxContentH, { fit: "inside" })
  .png()
  .toBuffer();
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
const capBuf = await sharp(captionPng()).resize(W, CAPTION_H).png().toBuffer();
const captionTop = Math.max(0, contentH - overlap);
const out = await sharp({
  create: { width: W, height: H, channels: 3, background: "#12101a" },
})
  .composite([
    { input: bodyBuf, top: 0, left: bodyLeft },
    { input: capBuf, top: captionTop, left: 0 },
  ])
  .jpeg({ quality: 92, mozjpeg: true })
  .toBuffer();

writeFileSync(output, out);
console.log("wrote", output);
