import { Resvg } from "@resvg/resvg-js";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const fontPath = "/usr/share/fonts/truetype/wqy/wqy-microhei.ttc";

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1220" height="1016" viewBox="0 0 1220 1016">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#12101a"/>
      <stop offset="100%" stop-color="#1a1624"/>
    </linearGradient>
    <pattern id="grid" width="64" height="64" patternUnits="userSpaceOnUse">
      <path d="M 64 0 L 0 0 0 64" fill="none" stroke="#3d3550" stroke-width="1" opacity="0.35"/>
    </pattern>
  </defs>
  <rect width="1220" height="1016" fill="url(#bg)"/>
  <rect width="1220" height="1016" fill="url(#grid)"/>
  <rect width="1220" height="8" fill="#ff5c8a"/>
  <rect x="80" y="468" width="120" height="6" fill="#ff5c8a" rx="2"/>
  <text x="80" y="400" fill="#f5f3ff" font-family="WenQuanYi Micro Hei" font-size="62" font-weight="700">オリジナルボードゲームの</text>
  <text x="80" y="478" fill="#f5f3ff" font-family="WenQuanYi Micro Hei" font-size="62" font-weight="700">Webプレイ版制作</text>
  <text x="80" y="560" fill="#c4b5fd" font-family="WenQuanYi Micro Hei" font-size="36">ルール・仕様の整理～URL納品まで対応します</text>
  <circle cx="1120" cy="916" r="12" fill="#ff5c8a"/>
  <circle cx="1080" cy="876" r="12" fill="#ff5c8a" opacity="0.7"/>
</svg>`;

const resvg = new Resvg(svg, {
  font: {
    fontFiles: [fontPath],
    loadSystemFonts: true,
    defaultFontFamily: "WenQuanYi Micro Hei",
  },
  fitTo: { mode: "width", value: 1220 },
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
