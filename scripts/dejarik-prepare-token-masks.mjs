/**
 * トークン PNG の暗い背景を透過にする（ガーディアン等、四隅が不透明な素材向け）
 * プレイヤー色マスク用の白シルエット化は行わない。
 */
import fs from "fs";
import path from "path";
import sharp from "sharp";

const dir = path.join(process.cwd(), "public/games/dejarik");
const names = ["brute", "predator", "guardian", "scout"];

function colorDist(r1, g1, b1, r2, g2, b2) {
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
}

function removeEdgeBackground(data, width, height, tolerance = 42) {
  const n = width * height;
  const visited = new Uint8Array(n);
  const queue = [];

  const push = (x, y) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const idx = y * width + x;
    if (visited[idx]) return;
    const i = idx * 4;
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];
    if (a < 8) {
      visited[idx] = 1;
      return;
    }
    const corners = [
      [data[0], data[1], data[2]],
      [data[(width - 1) * 4], data[(width - 1) * 4 + 1], data[(width - 1) * 4 + 2]],
    ];
    let nearBg = false;
    for (const [cr, cg, cb] of corners) {
      if (colorDist(r, g, b, cr, cg, cb) <= tolerance) {
        nearBg = true;
        break;
      }
    }
    if (!nearBg && r > 240 && g > 240 && b > 240) nearBg = true;
    if (!nearBg && r < 24 && g < 24 && b < 24) nearBg = true;
    if (!nearBg) return;
    visited[idx] = 1;
    data[i + 3] = 0;
    queue.push([x, y]);
  };

  for (let x = 0; x < width; x++) {
    push(x, 0);
    push(x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    push(0, y);
    push(width - 1, y);
  }

  while (queue.length > 0) {
    const [x, y] = queue.pop();
    push(x + 1, y);
    push(x - 1, y);
    push(x, y + 1);
    push(x, y - 1);
  }
}

for (const name of names) {
  const input = path.join(dir, `dejarik-${name}-token.png`);
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({
    resolveWithObject: true,
  });
  removeEdgeBackground(data, info.width, info.height);
  await sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png({ compressionLevel: 9 })
    .toFile(input);
  console.log("edge-bg removed", input);
}
