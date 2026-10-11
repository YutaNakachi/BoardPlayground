import { Resvg } from "@resvg/resvg-js";

export const CAPTION_H = 112;
export const CAPTION_OVERLAP = 32;

const fontPath = "/usr/share/fonts/truetype/wqy/wqy-microhei.ttc";

function escapeXml(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** 1枚目キービジュアル寄り：白＋ピンク縁のタイトル、ゴールドのサブ */
export function captionPng(title, width = 1220) {
  const t = escapeXml(title);
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${CAPTION_H}">
  <defs>
    <linearGradient id="bgFade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#12101a" stop-opacity="0"/>
      <stop offset="20%" stop-color="#1a0a2e" stop-opacity="0.92"/>
      <stop offset="100%" stop-color="#12101a" stop-opacity="0.98"/>
    </linearGradient>
    <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#ffb347"/>
      <stop offset="45%" stop-color="#ffe08a"/>
      <stop offset="100%" stop-color="#ffb347"/>
    </linearGradient>
    <linearGradient id="titleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="50%" stop-color="#fef3ff"/>
      <stop offset="100%" stop-color="#fce7f3"/>
    </linearGradient>
    <filter id="titleGlow" x="-8%" y="-8%" width="116%" height="116%">
      <feGaussianBlur stdDeviation="2.5" result="b"/>
      <feMerge>
        <feMergeNode in="b"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  <rect width="${width}" height="${CAPTION_H}" fill="url(#bgFade)"/>
  <text
    x="${width / 2}"
    y="46"
    text-anchor="middle"
    fill="url(#titleGrad)"
    font-family="WenQuanYi Micro Hei"
    font-size="38"
    font-weight="700"
    filter="url(#titleGlow)"
  >${t}</text>
  <text
    x="${width / 2}"
    y="88"
    text-anchor="middle"
    fill="url(#gold)"
    font-family="WenQuanYi Micro Hei"
    font-size="26"
    font-weight="700"
  >公開中のゲーム画面</text>
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
