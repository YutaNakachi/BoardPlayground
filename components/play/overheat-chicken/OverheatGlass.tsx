"use client";

import { useEffect, useId, useState, type CSSProperties } from "react";
import {
  CAPACITY_MIN,
  type ChipSize,
  type OverheatState,
} from "@/lib/play/overheat-chicken";

const RIM_Y = 352;
const DOME_CX = 432;
const DOME_RX = 214;
const WATER_BOTTOM = 828;
const BASE_RY = 96;
const SLOT = 16;
const COIN_R = 58;
/** 杯の内側の底。チップはここへ沈んで重なる。 */
const COIN_FLOOR = 792;
/** 絵の大きさ。水位の上がりに合わせ、小ほど小さい。 */
const CHIP_DRAW: Record<ChipSize, number> = {
  s: 0.62,
  m: 0.8,
  l: 1,
};
/** 底でのずれ。先の枚が下、あとの枚が少し上に重なる。x, 上方向。 */
const CHIP_PILE: readonly [number, number][] = [
  [0, 0],
  [-46, 12],
  [48, 10],
  [-12, 26],
  [34, 28],
  [-44, 32],
  [14, 44],
  [-30, 46],
  [40, 50],
  [-6, 60],
  [22, 64],
  [-38, 66],
  [8, 76],
  [-20, 80],
  [30, 82],
  [-2, 92],
  [16, 96],
  [-24, 100],
  [4, 108],
];

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
  "M 190 362 L 202 480 L 215 620 L 227 740 L 236 828 L 629 828 L 638 740 L 650 620 L 664 480 L 676 362 Z";

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

function dripPath(side: -1 | 1, bulge: number, y0: number): string {
  const startX = wallX(y0, side) + side * -4;
  const midY = 700;
  const midX = wallX(midY, side) + side * bulge;
  const endX = wallX(930, side) + side * -2;
  return `M ${startX} ${y0} Q ${midX} ${midY} ${endX} 1052`;
}

type Props = {
  state: OverheatState;
  label: string;
};

export function OverheatGlass({ state, label }: Props) {
  const rawId = useId().replace(/:/g, "");
  const waterId = `overheat-water-${rawId}`;
  const over = state.winner !== null;
  const ry = over ? 18 : BASE_RY + state.fill * SLOT;
  const surface = RIM_Y - ry;
  const chips = state.chips;
  const wobble = !over && state.fill >= CAPACITY_MIN;
  const depth = Math.max(0, state.fill - (CAPACITY_MIN - 1));
  const wobblePx = Math.min(6, 2 + depth * 0.8);
  const wobbleSec = Math.max(0.45, 1.15 - depth * 0.08);
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
        .overheat-drip {
          stroke-dasharray: 100;
          stroke-dashoffset: 0;
        }
        .overheat-spill .overheat-drip {
          animation: overheat-drip 0.7s ease-out both;
        }
        @keyframes overheat-drip {
          from { stroke-dashoffset: 100; opacity: 0.2; }
          to { stroke-dashoffset: 0; opacity: 1; }
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
      <div className="relative aspect-[3/4] w-full" role="img" aria-label={label}>
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
              <stop offset="0%" stopColor="#e0faff" />
              <stop offset="16%" stopColor="#67e8f9" />
              <stop offset="42%" stopColor="#22d3ee" />
              <stop offset="100%" stopColor="#0e7490" />
            </linearGradient>
          </defs>
          <path d={BOWL} fill={`url(#${waterId})`} />
          <g
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
              cy={surface + Math.max(10, ry * 0.28)}
              rx={DOME_RX * 0.62}
              ry={over ? 5 : 11}
              fill="#f0fdff"
              opacity={over ? 0.4 : 0.72}
            />
          </g>
          {chips.map((chip, index) => {
            const [dx, up] = CHIP_PILE[index] ?? [0, 12];
            const radius = COIN_R * CHIP_DRAW[chip.size];
            const cy = COIN_FLOOR - up + COIN_R - radius;
            return (
              <Coin
                key={`in-${index}`}
                cx={DOME_CX + dx}
                cy={cy}
                radius={radius}
                player={chip.player}
                spin={index * 37}
                sinkFrom={
                  !reducedMotion && index === freshIndex
                    ? surface + radius - cy
                    : undefined
                }
              />
            );
          })}
        </svg>
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
            <path
              className="overheat-drip"
              pathLength={100}
              d={dripPath(-1, 10, 358)}
              fill="none"
              stroke="#67e8f9"
              strokeWidth="22"
              strokeLinecap="round"
            />
            <path
              className="overheat-drip"
              pathLength={100}
              d={dripPath(1, 10, 358)}
              fill="none"
              stroke="#67e8f9"
              strokeWidth="22"
              strokeLinecap="round"
            />
            <path
              className="overheat-drip"
              pathLength={100}
              d={dripPath(-1, 4, 390)}
              fill="none"
              stroke="#e0faff"
              strokeWidth="9"
              strokeLinecap="round"
            />
            <path
              className="overheat-drip"
              pathLength={100}
              d={dripPath(1, 4, 390)}
              fill="none"
              stroke="#e0faff"
              strokeWidth="9"
              strokeLinecap="round"
            />
            <ellipse
              className="overheat-puddle"
              cx="432"
              cy="1064"
              rx="250"
              ry="24"
              fill="#67e8f9"
            />
          </svg>
        ) : null}
      </div>
      <p className="sr-only">
        水位と上限の数字は表示しません。
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
