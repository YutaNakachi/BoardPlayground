/**
 * マスク用: 不透明部分を白シルエット + アルファに正規化
 */
import fs from "fs";
import path from "path";
import sharp from "sharp";

const dir = path.join(process.cwd(), "public/games/dejarik");
const names = ["brute", "predator", "guardian", "scout"];

for (const name of names) {
  const input = path.join(dir, `dejarik-${name}-token.png`);
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({
    resolveWithObject: true,
  });
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];
    const bg =
      a < 8 || (r > 240 && g > 240 && b > 240) || (r < 20 && g < 20 && b < 20 && a > 200);
    if (bg) {
      data[i + 3] = 0;
    } else {
      const lum = Math.max(r, g, b);
      data[i] = 255;
      data[i + 1] = 255;
      data[i + 2] = 255;
      data[i + 3] = Math.min(255, Math.max(a, lum));
    }
  }
  await sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png({ compressionLevel: 9, palette: true })
    .toFile(input);
  console.log("normalized", input);
}
