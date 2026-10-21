"use client";

import { useId, type CSSProperties } from "react";
import { getPlayerTurnStyle } from "@/lib/player-colors";
import {
  CAPACITY_MAX,
  CAPACITY_MIN,
  coinsOf,
  type OverheatState,
} from "@/lib/play/overheat-chicken";

const RIM_Y = 250;
const SLOT = 16;
const BASE_DOME = 28;
const GLASS_TOP = 48;
const GLASS_BOTTOM = 378;

function surfaceY(fill: number): number {
  return RIM_Y - BASE_DOME - fill * SLOT;
}

/** 杯の壁の x。side は -1 が左。 */
function wallX(y: number, side: -1 | 1): number {
  const t = Math.min(1, Math.max(0, (y - GLASS_TOP) / (GLASS_BOTTOM - GLASS_TOP)));
  const left = 58 + 16 * t;
  const right = 162 - 16 * t;
  return side < 0 ? left : right;
}

function dripPath(side: -1 | 1, y0: number, bulge: number): string {
  const startX = wallX(y0, side) + side * 6;
  const midY = y0 + 70;
  const midX = wallX(midY, side) + side * bulge;
  const endX = wallX(410, side) + side * 2;
  return `M ${startX} ${y0} Q ${midX} ${midY} ${endX} 424`;
}

type Props = {
  state: OverheatState;
  label: string;
};

export function OverheatGlass({ state, label }: Props) {
  const rawId = useId().replace(/:/g, "");
  const clipId = `overheat-glass-${rawId}`;
  const waterId = `overheat-water-${rawId}`;
  const over = state.winner !== null;
  const shownFill = over ? state.capacity : state.fill;
  const top = surfaceY(shownFill);
  const coins = coinsOf(state);
  const inside = coins.filter((coin) => !coin.spilled);
  const spilled = coins.filter((coin) => coin.spilled);
  const wobble = !over && state.fill >= CAPACITY_MIN;
  const depth = Math.max(0, state.fill - (CAPACITY_MIN - 1));
  const wobblePx = Math.min(5, 1 + depth * 0.7);
  const wobbleSec = Math.max(0.45, 1.15 - depth * 0.08);

  return (
    <div className="mx-auto w-full max-w-[240px]">
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
        .overheat-coin-out {
          transform-box: fill-box;
          transform-origin: center;
        }
        .overheat-spill .overheat-coin-out {
          animation: overheat-coin-out 0.7s ease-out both;
        }
        @keyframes overheat-coin-out {
          from { transform: translateY(-40px); opacity: 0.2; }
          to { transform: translateY(0); opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          .overheat-wobble,
          .overheat-spill .overheat-drip,
          .overheat-spill .overheat-puddle,
          .overheat-spill .overheat-coin-out {
            animation: none;
          }
        }
      `}</style>
      <svg
        viewBox="0 0 220 470"
        className="h-auto w-full"
        role="img"
        aria-label={label}
      >
        <defs>
          <clipPath id={clipId}>
            <path d="M58 48 L74 378 Q110 404 146 378 L162 48 Q110 62 58 48 Z" />
          </clipPath>
          <linearGradient id={waterId} x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#0e7490" />
            <stop offset="58%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#cffafe" />
          </linearGradient>
        </defs>

        <ellipse cx="110" cy="418" rx="48" ry="9" fill="rgba(0,0,0,0.35)" />

        <path
          d="M58 48 L74 378 Q110 404 146 378 L162 48 Q110 62 58 48 Z"
          fill="rgba(255,255,255,0.05)"
          stroke="rgba(255,255,255,0.38)"
          strokeWidth="3"
        />

        <g clipPath={`url(#${clipId})`}>
          <rect
            x="50"
            y={top}
            width="120"
            height={420 - top}
            fill={`url(#${waterId})`}
          />
          <ellipse
            className={wobble ? "overheat-wobble" : undefined}
            style={
              wobble
                ? ({
                    ["--wobble-px" as string]: `${wobblePx}px`,
                    ["--wobble-sec" as string]: `${wobbleSec}s`,
                  } as CSSProperties)
                : undefined
            }
            cx="110"
            cy={top}
            rx="40"
            ry={over ? 4 : 12}
            fill="#e0faff"
            opacity={over ? 0.55 : 0.95}
          />
          {inside.map((coin, index) => {
            const fromTop = inside.length - 1 - index;
            return (
              <Coin
                key={`in-${index}`}
                cx={110}
                cy={top + 20 + fromTop * 16}
                player={coin.player}
              />
            );
          })}
        </g>

        <ellipse
          cx="110"
          cy={RIM_Y}
          rx="42"
          ry="6"
          fill="none"
          stroke="rgba(255,255,255,0.82)"
          strokeWidth="2"
        />
        <ellipse
          cx="110"
          cy="48"
          rx="54"
          ry="8"
          fill="none"
          stroke="rgba(255,255,255,0.45)"
          strokeWidth="3"
        />
        <text
          x="176"
          y={RIM_Y + 4}
          fill="#94a3b8"
          fontSize="12"
        >
          縁
        </text>

        {over ? (
          <g className="overheat-spill">
            <path
              className="overheat-drip"
              pathLength={100}
              d={dripPath(-1, top, 16)}
              fill="none"
              stroke="#67e8f9"
              strokeWidth="8"
              strokeLinecap="round"
            />
            <path
              className="overheat-drip"
              pathLength={100}
              d={dripPath(1, top, 16)}
              fill="none"
              stroke="#67e8f9"
              strokeWidth="8"
              strokeLinecap="round"
            />
            <path
              className="overheat-drip"
              pathLength={100}
              d={dripPath(-1, top + 8, 8)}
              fill="none"
              stroke="#e0faff"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <path
              className="overheat-drip"
              pathLength={100}
              d={dripPath(1, top + 8, 8)}
              fill="none"
              stroke="#e0faff"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <ellipse
              className="overheat-puddle"
              cx="110"
              cy="438"
              rx="74"
              ry="12"
              fill="#67e8f9"
            />
            {spilled.map((coin, index) => {
              const side = index % 2 === 0 ? -1 : 1;
              const slot = Math.floor(index / 2);
              return (
                <g key={`out-${index}`} className="overheat-coin-out">
                  <Coin
                    cx={110 + side * (58 + slot * 16)}
                    cy={430 - (index % 2) * 6}
                    player={coin.player}
                  />
                </g>
              );
            })}
          </g>
        ) : null}
      </svg>
      <p className="sr-only">
        上限の候補は{CAPACITY_MIN}枚から{CAPACITY_MAX}枚です。
      </p>
    </div>
  );
}

function Coin({
  cx,
  cy,
  player,
}: {
  cx: number;
  cy: number;
  player: 0 | 1;
}) {
  const style = getPlayerTurnStyle(player);
  return (
    <g>
      <circle cx={cx} cy={cy} r="11" fill="#0f172a" />
      <circle cx={cx} cy={cy} r="9" fill={style.fill} />
      <circle cx={cx + 2} cy={cy - 2} r="2.5" fill="#ffffff" opacity="0.85" />
    </g>
  );
}
