"use client";

import { useEffect, useId, useState, type CSSProperties } from "react";
import {
  domeRise,
  type ChipSize,
  type OverheatState,
} from "@/lib/play/overheat-chicken";

const RIM_Y = 360;
/** 写真の上の余白と、底より下の空きを枠から外す。 */
const FRAME_TOP = 185;
const FRAME_BOTTOM = 1032;
const FRAME_H = FRAME_BOTTOM - FRAME_TOP;
const DOME_CX = 432;
const DOME_RX = 214;
/** 杯の内側の底。厚いガラスの台には入れない。 */
const WATER_BOTTOM = 870;
const COIN_R = 58;
/** 杯の内側の底。チップはここへ沈んで重なる。 */
const COIN_FLOOR = 792;
/** 絵の大きさ。水位の上がりに合わせ、小ほど小さい。 */
const CHIP_DRAW: Record<ChipSize, number> = {
  s: 0.62,
  m: 0.8,
  l: 1,
};
function scatterUnit(seed: number, index: number): number {
  let n = Math.imul(Math.floor(seed * 997) + 1, 374761393) + Math.imul(index + 11, 668265263);
  n = (n ^ (n >>> 13)) >>> 0;
  n = Math.imul(n, 1274126177);
  n = (n ^ (n >>> 16)) >>> 0;
  return n / 4294967296;
}

/** 底の幅を使い、対局の seed で決まる位置に置く。描き直しで動かない。 */
function chipSpot(index: number, seed: number, radius: number): [number, number, number] {
  const across = scatterUnit(seed, index * 2) * 2 - 1;
  const lift = scatterUnit(seed, index * 2 + 1);
  const reach = Math.max(52, 172 - radius * 0.42);
  const dx = across * reach;
  const up = lift * 18;
  const spin = scatterUnit(seed, index + 40) * 360;
  return [dx, up, spin];
}

/** 写真の外縁。y, 左, 右。 */
const OUTER: readonly (readonly [number, number, number])[] = [
  [360, 164, 702],
  [520, 180, 686],
  [640, 191, 674],
  [760, 203, 662],
  [860, 212, 652],
  [940, 220, 645],
];

const BOWL =
  "M 190 362 L 202 480 L 215 620 L 227 740 L 238 820 L 250 845 L 330 862 L 432 870 L 534 862 L 614 845 L 626 820 L 637 740 L 650 620 L 664 480 L 676 362 Z";

function wallX(y: number, side: -1 | 1): number {
  let y0 = OUTER[0][0];
  let left = OUTER[0][1];
  let right = OUTER[0][2];
  const last = OUTER[OUTER.length - 1];
  let y1 = last[0];
  let left1 = last[1];
  let right1 = last[2];
  for (let i = 0; i < OUTER.length - 1; i += 1) {
    if (y >= OUTER[i][0] && y <= OUTER[i + 1][0]) {
      y0 = OUTER[i][0];
      left = OUTER[i][1];
      right = OUTER[i][2];
      y1 = OUTER[i + 1][0];
      left1 = OUTER[i + 1][1];
      right1 = OUTER[i + 1][2];
      break;
    }
  }
  const t = (y - y0) / Math.max(1, y1 - y0);
  const x = side < 0 ? left + (left1 - left) * t : right + (right1 - right) * t;
  return x;
}

/** 足の外側、左。ガラスの輪郭のすぐ外。右は中心で折り返す。 */
/** 足の外縁のすぐ外側。下端は底のカーブに沿って内側へ寄る。穴には入れない。 */
const FOOT_LEFT: readonly (readonly [number, number])[] = [
  [900, 214],
  [928, 216],
  [948, 222],
  [960, 232],
  [968, 250],
  [974, 272],
  [980, 300],
];

function sideX(x: number, side: -1 | 1): number {
  return side < 0 ? x : 864 - x;
}

function chain(points: readonly (readonly [number, number])[], move: boolean): string {
  const n = (v: number) => v.toFixed(1);
  let d = `${move ? "M" : "L"} ${n(points[0][0])} ${n(points[0][1])}`;
  if (points.length < 3) {
    for (let i = 1; i < points.length; i += 1) d += ` L ${n(points[i][0])} ${n(points[i][1])}`;
    return d;
  }
  for (let i = 1; i < points.length - 1; i += 1) {
    const mx = (points[i][0] + points[i + 1][0]) / 2;
    const my = (points[i][1] + points[i + 1][1]) / 2;
    d += ` Q ${n(points[i][0])} ${n(points[i][1])} ${n(mx)} ${n(my)}`;
  }
  const last = points[points.length - 1];
  d += ` L ${n(last[0])} ${n(last[1])}`;
  return d;
}

function band(
  a: readonly (readonly [number, number])[],
  b: readonly (readonly [number, number])[],
): string {
  return `${chain(a, true)} ${chain([...b].reverse(), false)} Z`;
}

type LiquidRibbon = { body: string; glint: string };

/** 中心線から帯を作り、光の側にだけ細い反射を足す。 */
function liquidRibbon(
  samples: readonly (readonly [number, number, number, number])[],
  side: -1 | 1,
): LiquidRibbon {
  const bodyA: [number, number][] = [];
  const bodyB: [number, number][] = [];
  const glintA: [number, number][] = [];
  const glintB: [number, number][] = [];
  for (let i = 0; i < samples.length; i += 1) {
    const prev = samples[Math.max(0, i - 1)];
    const next = samples[Math.min(samples.length - 1, i + 1)];
    let tx = next[0] - prev[0];
    let ty = next[1] - prev[1];
    const len = Math.hypot(tx, ty) || 1;
    tx /= len;
    ty /= len;
    let nx = -ty;
    let ny = tx;
    const [x, y, w, gw] = samples[i];
    bodyA.push([x + nx * w, y + ny * w]);
    bodyB.push([x - nx * w, y - ny * w]);
    if (nx * side * 0.4 + ny * -1 < 0) {
      nx = -nx;
      ny = -ny;
    }
    const shift = Math.min(w * 0.34, Math.max(0.2, w - gw - 0.3));
    glintA.push([x + nx * (shift + gw), y + ny * (shift + gw)]);
    glintB.push([x + nx * Math.max(0, shift - gw), y + ny * Math.max(0, shift - gw)]);
  }
  return { body: band(bodyA, bodyB), glint: band(glintA, glintB) };
}

/** 表面張力から縁を巻いて下り、水たまりの上で広がって溶ける。座標は左溢れで書き、反対側は折り返す。 */
function dripLiquid(side: -1 | 1): LiquidRibbon {
  const left: (readonly [number, number, number, number])[] = [];
  const add = (x: number, y: number, w: number, g: number) => left.push([x, y, w, g]);
  const lip: readonly (readonly [number, number, number, number])[] = [
    [278, 343, 3.4, 0.08],
    [252, 350, 5.8, 0.24],
    [230, 358, 6.8, 0.36],
    [210, 368, 7.2, 0.28],
    [196, 379, 7, 0.14],
    [184, 392, 7, 0.08],
    [174, 408, 7, 0.08],
  ];
  for (const point of lip) add(...point);
  for (const y of [430, 530, 650, 770, 870]) {
    add(wallX(y, -1) + 2, y, 7, 0.08);
  }
  add(wallX(900, -1) + 1, 900, 7.4, 0.08);
  add(200, 948, 10, 0.08);
  add(182, 976, 15, 0.06);
  add(160, 994, 18, 0.04);
  return liquidRibbon(
    left.map(([x, y, w, g]) => [sideX(x, side), y, w, g]),
    side,
  );
}

/** こぼれた側の足もとに沿い、底の裏には入らない。 */
function spillPool(side: -1 | 1): string {
  const hug = FOOT_LEFT.map(([y, x]) => `${sideX(x, side)} ${y}`).join(" L ");
  const p = (x: number, y: number) => `${sideX(x, side)} ${y}`;
  return `M ${hug} C ${p(250, 1006)} ${p(150, 1024)} ${p(78, 992)} C ${p(68, 968)} ${p(140, 940)} ${p(214, 900)} Z`;
}

type Props = {
  state: OverheatState;
  label: string;
};

export function OverheatGlass({ state, label }: Props) {
  const rawId = useId().replace(/:/g, "");
  const waterId = `overheat-water-${rawId}`;
  const over = state.winner !== null;
  const spillSide: -1 | 1 = scatterUnit(state.visual.seed, 7) < 0.5 ? -1 : 1;
  const ry = over ? 32 : domeRise(state);
  const surface = RIM_Y - ry;
  const chips = state.chips;
  const pastWobble = ry - state.visual.wobbleAt;
  const wobble = !over && pastWobble >= 0;
  const wobblePx = Math.min(6, 1.6 + Math.max(0, pastWobble) * 0.025);
  const wobbleSec = Math.max(0.45, 1.2 - Math.max(0, pastWobble) * 0.004);
  const reducedMotion = usePrefersReducedMotion();
  const freshIndex = state.placed > 0 ? chips.length - 1 : -1;

  return (
    <div className="mx-auto w-full max-w-[340px]">
      <style>{`
        .overheat-wobble {
          transform-box: fill-box;
          transform-origin: center;
          animation: overheat-wobble var(--wobble-sec) ease-in-out infinite;
        }
        @keyframes overheat-wobble {
          0%, 100% { transform: translateX(var(--wobble-px)); }
          50% { transform: translateX(calc(var(--wobble-px) * -1)); }
        }
        .overheat-spill .overheat-drip {
          animation: overheat-drip 0.7s ease-out both;
        }
        @keyframes overheat-drip {
          from { opacity: 0.15; }
          to { opacity: 1; }
        }
        .overheat-puddle {
          transform-box: fill-box;
          transform-origin: center;
        }
        .overheat-spill .overheat-puddle {
          animation: overheat-puddle 0.7s ease-out both;
        }
        @keyframes overheat-puddle {
          from { transform: scaleX(0.15); opacity: 0.2; }
          to { transform: scaleX(1); opacity: 0.92; }
        }
        .overheat-sink {
          animation: overheat-sink-fade 0.85s ease-out both;
        }
        @keyframes overheat-sink-fade {
          from { opacity: 0.2; }
          35% { opacity: 1; }
          to { opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          .overheat-wobble,
          .overheat-spill .overheat-drip,
          .overheat-spill .overheat-puddle,
          .overheat-sink {
            animation: none;
          }
        }
      `}</style>
      <div
        className="relative w-full overflow-hidden"
        style={{ aspectRatio: `864 / ${FRAME_H}` }}
        role="img"
        aria-label={label}
      >
        <div
          className="absolute left-0 w-full"
          style={{
            top: `${(-FRAME_TOP / FRAME_H) * 100}%`,
            height: `${(1152 / FRAME_H) * 100}%`,
          }}
        >
        <svg
          viewBox="0 0 864 1152"
          className="absolute inset-0 h-full w-full"
          aria-hidden
        >
          <defs>
            <linearGradient
              id={waterId}
              x1="0"
              y1={surface}
              x2="0"
              y2={WATER_BOTTOM}
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor="#f8e6be" />
              <stop offset="25%" stopColor="#e8b058" />
              <stop offset="60%" stopColor="#c47c28" />
              <stop offset="100%" stopColor="#b06222" />
            </linearGradient>
            <linearGradient
              id={`${waterId}-floor`}
              x1="0"
              y1="856"
              x2="0"
              y2="876"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor="#fff" />
              <stop offset="100%" stopColor="#000" />
            </linearGradient>
            <clipPath id={`${waterId}-meniscus`} clipPathUnits="userSpaceOnUse">
              <rect x="150" y="300" width="564" height="42" />
            </clipPath>
            <mask
              id={`${waterId}-mask`}
              maskUnits="userSpaceOnUse"
              x="0"
              y="0"
              width="864"
              height="1152"
            >
              <rect x="0" y="0" width="864" height="856" fill="#fff" />
              <rect
                x="0"
                y="856"
                width="864"
                height="24"
                fill={`url(#${waterId}-floor)`}
              />
            </mask>
          </defs>
          <path d={BOWL} fill={`url(#${waterId})`} mask={`url(#${waterId}-mask)`} />
          <path
            d={`M 188 ${RIM_Y} L 676 ${RIM_Y} L 676 372 L 188 372 Z`}
            fill={`url(#${waterId})`}
          />
          {ry < 8 && !over ? (
            <line
              x1="206"
              y1={RIM_Y}
              x2="658"
              y2={RIM_Y}
              stroke="#fff1d4"
              strokeWidth="2.5"
              opacity="0.7"
            />
          ) : null}
          {ry > 0 ? (
            <g
              clipPath={over ? `url(#${waterId}-meniscus)` : undefined}
              className={wobble ? "overheat-wobble" : undefined}
              style={
                wobble
                  ? ({
                      ["--wobble-px" as string]: `${wobblePx}px`,
                      ["--wobble-sec" as string]: `${wobbleSec}s`,
                    } as CSSProperties)
                  : undefined
              }
            >
              <ellipse
                cx={DOME_CX}
                cy={RIM_Y}
                rx={DOME_RX}
                ry={ry}
                fill={`url(#${waterId})`}
              />
              <ellipse
                cx={DOME_CX}
                cy={surface + Math.max(4, ry * 0.28)}
                rx={DOME_RX * 0.62}
                ry={Math.max(3, Math.min(11, ry * 0.22))}
                fill="#fff4d6"
                opacity="0.72"
              />
            </g>
          ) : null}
          {chips.map((chip, index) => {
            const radius = COIN_R * CHIP_DRAW[chip.size];
            const [dx, up, spin] = chipSpot(index, state.visual.seed, radius);
            const cy = COIN_FLOOR - up + COIN_R - radius;
            return (
              <Coin
                key={`in-${index}`}
                cx={DOME_CX + dx}
                cy={cy}
                radius={radius}
                player={chip.player}
                spin={spin}
                sinkFrom={
                  !reducedMotion && index === freshIndex
                    ? surface + radius - cy
                    : undefined
                }
              />
            );
          })}
        </svg>
        {over ? (
          <svg
            viewBox="0 0 864 1152"
            className="overheat-spill pointer-events-none absolute inset-0 h-full w-full"
            aria-hidden
          >
            <defs>
              <linearGradient
                id={`${waterId}-pool`}
                x1="0"
                y1="880"
                x2="0"
                y2="1020"
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0%" stopColor="#a86420" />
                <stop offset="40%" stopColor="#c47a28" />
                <stop offset="100%" stopColor="#d4923a" />
              </linearGradient>
            </defs>
            <path className="overheat-puddle" d={spillPool(spillSide)} fill={`url(#${waterId}-pool)`} />
          </svg>
        ) : null}
        <img
          src="/games/overheat-chicken/glass.png"
          alt=""
          draggable={false}
          className="pointer-events-none absolute inset-0 h-full w-full select-none"
        />
        {over ? (
          <svg
            viewBox="0 0 864 1152"
            className="overheat-spill pointer-events-none absolute inset-0 h-full w-full"
            aria-hidden
          >
            <defs>
              <linearGradient
                id={`${waterId}-drip`}
                x1="0"
                y1="336"
                x2="0"
                y2="760"
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0%" stopColor="#f4d9a6" />
                <stop offset="10%" stopColor="#e2a64a" />
                <stop offset="24%" stopColor="#c47a28" />
                <stop offset="100%" stopColor="#c47a28" />
              </linearGradient>
              <linearGradient
                id={`${waterId}-glint`}
                x1="0"
                y1="340"
                x2="0"
                y2="980"
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0%" stopColor="#fff6e0" stopOpacity="0" />
                <stop offset="3%" stopColor="#fff6e0" stopOpacity="0.55" />
                <stop offset="8%" stopColor="#ffe6b4" stopOpacity="0.08" />
                <stop offset="100%" stopColor="#fff6e0" stopOpacity="0" />
              </linearGradient>
              <linearGradient
                id={`${waterId}-melt`}
                x1={sideX(214, spillSide)}
                y1="940"
                x2={sideX(155, spillSide)}
                y2="1002"
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0%" stopColor="#fff" />
                <stop offset="35%" stopColor="#fff" />
                <stop offset="100%" stopColor="#000" />
              </linearGradient>
              <mask
                id={`${waterId}-meltmask`}
                maskUnits="userSpaceOnUse"
                x="0"
                y="0"
                width="864"
                height="1152"
              >
                <rect x="0" y="0" width="864" height="1152" fill={`url(#${waterId}-melt)`} />
              </mask>
              <filter id={`${waterId}-glintblur`} x="-50%" y="-20%" width="200%" height="140%" colorInterpolationFilters="sRGB">
                <feGaussianBlur stdDeviation="1.1" />
              </filter>
            </defs>
            {(() => {
              const drip = dripLiquid(spillSide);
              return (
                <g className="overheat-drip" mask={`url(#${waterId}-meltmask)`}>
                  <path d={drip.body} fill={`url(#${waterId}-drip)`} opacity="0.96" />
                  <path d={drip.glint} fill={`url(#${waterId}-glint)`} filter={`url(#${waterId}-glintblur)`} />
                </g>
              );
            })()}
          </svg>
        ) : null}
        </div>
      </div>
      <p className="sr-only">
        水位と上限の数字は出しません。
      </p>
    </div>
  );
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  return reduced;
}

function Coin({
  cx,
  cy,
  radius,
  player,
  spin,
  sinkFrom,
}: {
  cx: number;
  cy: number;
  radius: number;
  player: 0 | 1;
  spin: number;
  /** 水面からこの差だけ上に出して、底の位置まで落とす。 */
  sinkFrom?: number;
}) {
  const size = radius * 2;
  return (
    <g className={sinkFrom !== undefined ? "overheat-sink" : undefined}>
      {sinkFrom !== undefined ? (
        <animateTransform
          attributeName="transform"
          type="translate"
          from={`0 ${sinkFrom}`}
          to="0 0"
          begin="0s"
          dur="0.85s"
          fill="freeze"
        />
      ) : null}
      <image
        href={`/games/overheat-chicken/chip-${player}.png`}
        x={cx - radius}
        y={cy - radius}
        width={size}
        height={size}
        transform={`rotate(${spin} ${cx} ${cy})`}
      />
    </g>
  );
}
