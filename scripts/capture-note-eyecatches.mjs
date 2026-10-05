/**
 * note 用アイキャッチ: 盤面キャプチャ＋ダークグラデーション（文字・宣伝絵なし）。
 * Usage: node scripts/capture-note-eyecatches.mjs [baseUrl]
 */
import { chromium } from "playwright";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "../docs/note/eyecatch");
const BASE = process.argv[2] ?? "http://127.0.0.1:3000";
const W = 1280;
const H = 670;

/** @type {Record<string, { glow: string; boardFill: number }>} */
const LOOK = {
  ludo: { glow: "rgba(255, 179, 71, 0.14)", boardFill: 0.82 },
  mancala: { glow: "rgba(98, 180, 255, 0.13)", boardFill: 0.88 },
  "fox-hounds": { glow: "rgba(129, 140, 248, 0.14)", boardFill: 0.9 },
  hex: { glow: "rgba(255, 125, 158, 0.12)", boardFill: 0.92 },
  "mini-shogi": { glow: "rgba(251, 191, 36, 0.11)", boardFill: 0.78 },
};

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
  div.rounded-2xl.border-2.px-4.py-4,
  div.space-y-6 > .flex.flex-col.items-center,
  div.space-y-6 > .text-center,
  div.space-y-5 > .flex.flex-wrap.items-center.justify-center.gap-4,
  div.space-y-5 > .flex.flex-wrap.items-center.justify-center.gap-3,
  p.text-center.text-xs.text-slate-500 {
    display: none !important;
  }
  section.rounded-xl.border.p-3 {
    display: none !important;
  }
  .mx-auto.grid.max-w-xl .row-span-2 > span.text-\\[10px\\],
  .mx-auto.grid.max-w-xl .tabular-nums {
    visibility: hidden !important;
  }
  .text-\\[9px\\] {
    display: none !important;
  }
  [aria-label="ウサギと猟犬の盤"] text {
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
      for (let attempt = 0; attempt < 10; attempt++) {
        const roll = page.getByRole("button", { name: /サイコロ/ });
        if (await roll.isVisible().catch(() => false)) {
          await roll.click();
          await page.waitForTimeout(650);
        }
        const token = page.locator("button.rounded-full.z-10").first();
        if (await token.isVisible().catch(() => false) && !(await token.isDisabled())) {
          await token.click();
          await page.waitForTimeout(850);
        }
        const endTurn = page.getByRole("button", { name: /手番を終える|もう一度振る/ });
        if (await endTurn.isVisible().catch(() => false)) {
          await endTurn.click();
          await page.waitForTimeout(350);
        }
      }
    },
  },
  mancala: {
    board: "div.mx-auto.grid.max-w-xl",
    async afterStart(page) {
      for (let i = 0; i < 3; i++) {
        const pits = page.locator('button[aria-label^="P1 穴"]');
        const n = await pits.count();
        for (let j = 0; j < n; j++) {
          const pit = pits.nth(j);
          if (await pit.isEnabled().catch(() => false)) {
            await pit.click();
            await page.waitForTimeout(1000);
            break;
          }
        }
      }
    },
  },
  "fox-hounds": {
    board: '[aria-label="ウサギと猟犬の盤面"]',
  },
  hex: {
    board: 'div.relative:has(svg[aria-label="ヘックスの盤"])',
    async afterStart(page) {
      const svg = page.locator('svg[aria-label="ヘックスの盤"]');
      const box = await svg.boundingBox();
      if (!box) return;
      const offsets = [
        [0.5, 0.48],
        [0.56, 0.44],
        [0.44, 0.52],
        [0.6, 0.5],
        [0.4, 0.46],
        [0.52, 0.56],
      ];
      for (const [rx, ry] of offsets) {
        await page.mouse.click(box.x + box.width * rx, box.y + box.height * ry);
        await page.waitForTimeout(260);
      }
    },
  },
  "mini-shogi": {
    board: "div.mx-auto.grid.max-w-xs.grid-cols-5.rounded-xl",
    async afterStart(page) {
      const from = page.locator("button").filter({ has: page.locator("text=歩") }).first();
      if (await from.isVisible().catch(() => false)) {
        await from.click();
        await page.waitForTimeout(220);
        const dest = page.locator("button.ring-lime-400").first();
        if (await dest.isVisible().catch(() => false)) {
          await dest.click();
          await page.waitForTimeout(350);
        }
      }
    },
  },
};

async function startLocalGame(page) {
  await page.getByRole("button", { name: "ゲーム開始" }).click();
  await page.waitForTimeout(500);
}

async function stageBoard(page, boardSelector, slug) {
  const look = LOOK[slug];
  await page.evaluate(
    ({ sel, vw, vh, glow, boardFill }) => {
      document.documentElement.style.overflow = "hidden";
      document.body.style.overflow = "hidden";
      document.body.style.margin = "0";

      const board = document.querySelector(sel);
      if (!board) throw new Error(`board not found: ${sel}`);

      for (const el of document.querySelectorAll(".mb-6.flex.flex-wrap")) {
        el.style.display = "none";
      }

      const rect = board.getBoundingClientRect();
      board.style.width = `${rect.width}px`;
      board.style.height = `${rect.height}px`;
      board.style.flexShrink = "0";
      board.style.boxSizing = "border-box";
      board.style.borderRadius = "20px";
      board.style.overflow = "hidden";
      board.style.filter =
        "drop-shadow(0 32px 72px rgba(0, 0, 0, 0.55)) drop-shadow(0 0 48px rgba(255, 255, 255, 0.04))";

      const stage = document.createElement("div");
      stage.id = "eyecatch-stage";
      stage.style.cssText = [
        "position:fixed",
        "inset:0",
        "display:flex",
        "align-items:center",
        "justify-content:center",
        `background-color:#12101a`,
        `background-image:
          radial-gradient(ellipse 120% 90% at 50% 36%, ${glow} 0%, transparent 58%),
          radial-gradient(ellipse 95% 80% at 50% 50%, #1c1826 0%, #12101a 72%),
          radial-gradient(ellipse 100% 100% at 50% 50%, transparent 42%, rgba(0,0,0,0.45) 100%)`,
        "z-index:40",
      ].join(";");
      document.body.style.background = "#12101a";
      document.body.appendChild(stage);
      stage.appendChild(board);

      for (const child of Array.from(document.body.children)) {
        if (child !== stage) child.style.display = "none";
      }

      const pad = 40;
      const targetW = vw * boardFill;
      const targetH = vh * boardFill;
      const scale = Math.min(targetW / rect.width, targetH / rect.height);
      board.style.transform = `scale(${scale})`;
      board.style.transformOrigin = "center center";
      board.style.willChange = "transform";
    },
    { sel: boardSelector, vw: W, vh: H, glow: look.glow, boardFill: look.boardFill }
  );
  await page.waitForTimeout(180);
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
  await stageBoard(page, cfg.board, slug);
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
