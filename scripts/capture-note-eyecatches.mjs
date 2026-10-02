/**
 * note 用アイキャッチ: プレイ画面の盤面をフルサイズでキャプチャ（宣伝文字・UI文言なし）。
 * Usage: NODE_PATH=/tmp/node_modules node scripts/capture-note-eyecatches.mjs [baseUrl]
 */
import { chromium } from "playwright";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "../docs/note/eyecatch");
const BASE = process.argv[2] ?? "http://127.0.0.1:3000";
const W = 1280;
const H = 670;

const HIDE_CHROME_CSS = `
  a[href="/"],
  h1.text-2xl,
  .badge-local,
  .badge-online,
  .badge-cpu,
  button:has-text("ルール"),
  button:has-text("はじめから"),
  .mb-6.flex.flex-wrap.items-start.justify-between.gap-4 {
    display: none !important;
  }
  /* 手番バナー内の文言のみ非表示（色付きバーは残す） */
  div.rounded-2xl.border-2.px-4.py-4 p,
  div.rounded-2xl.border-2.px-4.py-4 .font-display {
    visibility: hidden !important;
  }
  /* 結果・盤下ボタン */
  div.space-y-6 > div.rounded-2xl.border-2:has(button),
  div.space-y-5 > div.rounded-2xl.border-2:has(button),
  div.space-y-6 > .flex.flex-col.items-center,
  div.space-y-6 > .text-center,
  div.space-y-5 > .flex.flex-wrap.items-center.justify-center.gap-4,
  div.space-y-5 > .flex.flex-wrap.items-center.justify-center.gap-3 {
    display: none !important;
  }
  /* 5五将棋: 持ち駒パネル（盤のみ大きく見せる） */
  section.rounded-xl.border.p-3 {
    display: none !important;
  }
  /* マンカラ: ゴールのプレイヤーラベルだけ非表示 */
  .mx-auto.grid.max-w-xl .row-span-2 > span.text-\\[10px\\] {
    display: none !important;
  }
  /* ルドー: 重なりコマの枚数表示 */
  .text-\\[9px\\] {
    display: none !important;
  }
  nextjs-portal,
  [data-nextjs-toast],
  [data-nextjs-dialog-overlay] {
    display: none !important;
  }
`;

/** @type {Record<string, { board: string; afterStart?: (page: import('playwright').Page) => Promise<void> }>} */
const GAMES = {
  ludo: {
    board: 'div.mx-auto.w-full[class*="22rem"]',
    async afterStart(page) {
      for (let attempt = 0; attempt < 12; attempt++) {
        const roll = page.getByRole("button", { name: /サイコロ/ });
        if (await roll.isVisible().catch(() => false)) {
          await roll.click();
          await page.waitForTimeout(700);
        }
        const token = page.locator("button.rounded-full.z-10").first();
        if (await token.isVisible().catch(() => false)) {
          const disabled = await token.isDisabled().catch(() => true);
          if (!disabled) {
            await token.click();
            await page.waitForTimeout(900);
          }
        }
        const endTurn = page.getByRole("button", { name: /手番を終える|もう一度振る/ });
        if (await endTurn.isVisible().catch(() => false)) {
          await endTurn.click();
          await page.waitForTimeout(400);
        }
      }
    },
  },
  mancala: {
    board: "div.mx-auto.grid.max-w-xl",
    async afterStart(page) {
      for (let i = 0; i < 4; i++) {
        const pits = page.locator('button[aria-label^="P1 穴"]');
        const n = await pits.count();
        for (let j = 0; j < n; j++) {
          const pit = pits.nth(j);
          if (await pit.isEnabled().catch(() => false)) {
            await pit.click();
            await page.waitForTimeout(1100);
            break;
          }
        }
      }
    },
  },
  "fox-hounds": {
    board: '[aria-label="ウサギと猟犬の盤面"]',
    async afterStart(page) {
      const board = page.locator('[aria-label="ウサギと猟犬の盤面"]');
      const box = await board.boundingBox();
      if (!box) return;
      const clicks = [
        [0.68, 0.5],
        [0.58, 0.38],
        [0.5, 0.5],
        [0.42, 0.62],
        [0.35, 0.5],
      ];
      for (const [rx, ry] of clicks) {
        await page.mouse.click(box.x + box.width * rx, box.y + box.height * ry);
        await page.waitForTimeout(450);
      }
    },
  },
  hex: {
    board: 'div.relative:has(svg[aria-label="ヘックスの盤"])',
    async afterStart(page) {
      const svg = page.locator('svg[aria-label="ヘックスの盤"]');
      const box = await svg.boundingBox();
      if (!box) return;
      const offsets = [
        [0.5, 0.48],
        [0.54, 0.44],
        [0.46, 0.52],
        [0.58, 0.5],
        [0.42, 0.46],
        [0.5, 0.56],
        [0.62, 0.44],
        [0.38, 0.54],
      ];
      for (const [rx, ry] of offsets) {
        await page.mouse.click(box.x + box.width * rx, box.y + box.height * ry);
        await page.waitForTimeout(280);
      }
    },
  },
  "mini-shogi": {
    board: "div.mx-auto.grid.max-w-xs.grid-cols-5.rounded-xl",
    async afterStart(page) {
      const from = page.locator("button").filter({ has: page.locator("text=歩") }).first();
      if (await from.isVisible().catch(() => false)) {
        await from.click();
        await page.waitForTimeout(250);
        const dest = page.locator("button.ring-lime-400").first();
        if (await dest.isVisible().catch(() => false)) {
          await dest.click();
          await page.waitForTimeout(400);
        }
      }
    },
  },
};

async function startLocalGame(page) {
  await page.getByRole("button", { name: "ゲーム開始" }).click();
  await page.waitForTimeout(500);
}

async function stageBoard(page, boardSelector) {
  await page.evaluate(
    ({ sel, vw, vh }) => {
      document.documentElement.style.overflow = "hidden";
      document.body.style.overflow = "hidden";
      document.body.style.margin = "0";
      document.body.style.background = "#12101a";

      const board = document.querySelector(sel);
      if (!board) throw new Error(`board not found: ${sel}`);
      const root = board.closest(".space-y-6, .space-y-5") || board;

      for (const el of document.querySelectorAll(".mb-6.flex.flex-wrap")) {
        el.style.display = "none";
      }

      const rect = root.getBoundingClientRect();
      root.style.width = `${rect.width}px`;
      root.style.height = `${rect.height}px`;
      root.style.flexShrink = "0";
      root.style.boxSizing = "border-box";

      const stage = document.createElement("div");
      stage.id = "eyecatch-stage";
      stage.style.cssText =
        "position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:#12101a;z-index:40;";
      document.body.appendChild(stage);
      stage.appendChild(root);

      for (const child of Array.from(document.body.children)) {
        if (child !== stage) child.style.display = "none";
      }

      const pad = 28;
      const scale = Math.min((vw - pad) / rect.width, (vh - pad) / rect.height);
      root.style.transform = `scale(${scale})`;
      root.style.transformOrigin = "center center";
      root.style.willChange = "transform";
    },
    { sel: boardSelector, vw: W, vh: H }
  );
  await page.waitForTimeout(150);
}

async function capture(slug, page) {
  const cfg = GAMES[slug];
  await page.goto(`${BASE}/play/${slug}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(200);
  await startLocalGame(page);
  if (cfg.afterStart) await cfg.afterStart(page);
  await page.addStyleTag({ content: HIDE_CHROME_CSS });
  const board = page.locator(cfg.board).first();
  await board.waitFor({ state: "visible", timeout: 15000 });
  await page.waitForTimeout(200);
  await stageBoard(page, cfg.board);
  const out = path.join(OUT_DIR, `${slug}.png`);
  await page.screenshot({ path: out, type: "png" });
  console.log("wrote", out);
}

async function main() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: W, height: H },
    deviceScaleFactor: 2,
    colorScheme: "dark",
  });
  const page = await context.newPage();
  for (const slug of Object.keys(GAMES)) {
    await capture(slug, page);
  }
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
