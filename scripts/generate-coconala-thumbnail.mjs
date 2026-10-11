/** 旧案: 文案のみのサムネ（未採用）。採用画像は docs/coconala/thumbnail-01.jpg */
import { Resvg } from "@resvg/resvg-js";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const fontPath = "/usr/share/fonts/truetype/wqy/wqy-microhei.ttc";

const W = 1220;
const H = 1016;
const CX = W / 2;

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1a0a2e"/>
      <stop offset="45%" stop-color="#12101a"/>
      <stop offset="100%" stop-color="#0d1f3d"/>
    </linearGradient>
    <linearGradient id="glowPink" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ff5c8a" stop-opacity="0.55"/>
      <stop offset="100%" stop-color="#ff5c8a" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="glowViolet" x1="100%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#8b5cf6" stop-opacity="0.5"/>
      <stop offset="100%" stop-color="#6366f1" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="topBar" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#ff5c8a"/>
      <stop offset="50%" stop-color="#ffb347"/>
      <stop offset="100%" stop-color="#ff5c8a"/>
    </linearGradient>
    <linearGradient id="titleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="45%" stop-color="#fef3ff"/>
      <stop offset="100%" stop-color="#e9d5ff"/>
    </linearGradient>
    <filter id="titleGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="3" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
      <path d="M 48 0 L 0 0 0 48" fill="none" stroke="#ff5c8a" stroke-width="0.6" opacity="0.12"/>
    </pattern>
    <radialGradient id="vignette" cx="50%" cy="50%" r="70%">
      <stop offset="55%" stop-color="#000000" stop-opacity="0"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0.45"/>
    </radialGradient>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#grid)"/>

  <!-- ambient glow -->
  <ellipse cx="280" cy="320" rx="320" ry="280" fill="url(#glowPink)"/>
  <ellipse cx="940" cy="700" rx="360" ry="300" fill="url(#glowViolet)"/>
  <ellipse cx="${CX}" cy="${CX}" rx="420" ry="200" fill="#ff5c8a" opacity="0.08"/>

  <!-- frame -->
  <rect x="28" y="28" width="${W - 56}" height="${H - 56}" fill="none" stroke="#ff5c8a" stroke-width="3" rx="24" opacity="0.35"/>
  <rect x="36" y="36" width="${W - 72}" height="${H - 72}" fill="none" stroke="#8b5cf6" stroke-width="1.5" rx="20" opacity="0.25"/>

  <rect width="${W}" height="10" fill="url(#topBar)"/>
  <rect y="${H - 6}" width="${W}" height="6" fill="url(#topBar)" opacity="0.85"/>

  <!-- corner pips (board-game hint) -->
  <g fill="#ff5c8a" opacity="0.9">
    <circle cx="88" cy="88" r="10"/>
    <circle cx="1132" cy="88" r="8" fill="#ffb347"/>
    <circle cx="88" cy="928" r="8" fill="#c4b5fd"/>
    <circle cx="1132" cy="928" r="10"/>
  </g>

  <!-- centered copy (safe zone ~ inner frame) -->
  <g filter="url(#titleGlow)">
    <text x="${CX}" y="400" text-anchor="middle" fill="url(#titleGrad)" font-family="WenQuanYi Micro Hei" font-size="64" font-weight="700">オリジナルボードゲームの</text>
    <text x="${CX}" y="482" text-anchor="middle" fill="url(#titleGrad)" font-family="WenQuanYi Micro Hei" font-size="64" font-weight="700">Webプレイ版制作</text>
  </g>

  <line x1="${CX - 200}" y1="518" x2="${CX + 200}" y2="518" stroke="#ff5c8a" stroke-width="4" stroke-linecap="round" opacity="0.9"/>
  <circle cx="${CX - 210}" cy="518" r="5" fill="#ffb347"/>
  <circle cx="${CX + 210}" cy="518" r="5" fill="#ffb347"/>

  <text x="${CX}" y="578" text-anchor="middle" fill="#ddd6fe" font-family="WenQuanYi Micro Hei" font-size="34">ルール・仕様の整理～URL納品まで対応します</text>

  <rect width="${W}" height="${H}" fill="url(#vignette)"/>
</svg>`;

const resvg = new Resvg(svg, {
  font: {
    fontFiles: [fontPath],
    loadSystemFonts: true,
    defaultFontFamily: "WenQuanYi Micro Hei",
  },
  fitTo: { mode: "width", value: W },
});

const png = resvg.render().asPng();
const paths = [
  join(root, "docs/coconala/thumbnail-01.png"),
  "/opt/cursor/artifacts/coconala-thumbnail-01.png",
];
for (const p of paths) {
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, png);
  console.log("wrote", p, png.length, "bytes");
}
