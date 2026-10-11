/**
 * 手元のプレイ画面スクショをココナラ用 JPEG にする（切り抜きなし・全体表示）。
 * 用法: node scripts/compose-coconala-screenshot.mjs <入力PNG> <ゲーム名> <出力jpg>
 */
import sharp from "sharp";
import { writeFileSync } from "node:fs";
import {
  CAPTION_H,
  CAPTION_OVERLAP,
  captionPng,
} from "./lib/coconala-caption.mjs";

const W = 1220;
const MAX_H = 1016;

const [input, title, output] = process.argv.slice(2);
if (!input || !title || !output) {
  console.error(
    "usage: node scripts/compose-coconala-screenshot.mjs <in.png> <title> <out.jpg>"
  );
  process.exit(1);
}

const bodyMaxH = MAX_H - CAPTION_H + CAPTION_OVERLAP;
const shot = await sharp(input).trim({ threshold: 12 }).png().toBuffer();
const bodyBuf = await sharp(shot)
  .resize(W, bodyMaxH, { fit: "inside" })
  .png()
  .toBuffer();
const { width: contentW, height: contentH } = await sharp(bodyBuf).metadata();
const bodyLeft = Math.max(0, Math.floor((W - contentW) / 2));
const outH = contentH + CAPTION_H - CAPTION_OVERLAP;
const captionTop = outH - CAPTION_H;

const capBuf = await sharp(captionPng(title, W))
  .resize(W, CAPTION_H)
  .png()
  .toBuffer();
const out = await sharp({
  create: { width: W, height: outH, channels: 3, background: "#12101a" },
})
  .composite([
    { input: bodyBuf, top: 0, left: bodyLeft },
    { input: capBuf, top: captionTop, left: 0 },
  ])
  .jpeg({ quality: 92, mozjpeg: true })
  .toBuffer();

writeFileSync(output, out);
console.log("wrote", output, `${W}x${outH}`);
