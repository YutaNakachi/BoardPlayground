"use client";

import { getPlayerTurnStyle } from "@/lib/player-colors";

type Props = {
  playerIndex: number;
  playerLabel: string;
  stats?: string;
  action?: string;
};

export function TurnBanner({ playerIndex, playerLabel, stats, action }: Props) {
  const style = getPlayerTurnStyle(playerIndex);

  return (
    <div
      className={`rounded-2xl border-2 px-4 py-4 ${style.border} ${style.bg} ${style.glow}`}
    >
      <div className="flex flex-wrap items-center gap-3">
        <span
          className={`flex h-3.5 w-3.5 shrink-0 animate-pulse rounded-full ${style.dot} ${style.dotShadow}`}
          aria-hidden
        />
        <p className="font-display text-lg font-extrabold tracking-tight text-white sm:text-xl">
          <span className={style.label}>{playerLabel}</span>
          <span className="text-slate-200">の手番</span>
        </p>
      </div>
      {stats ? <p className="mt-2 pl-7 text-sm text-slate-400">{stats}</p> : null}
      {action ? (
        <p className={`mt-1 pl-7 text-sm font-medium ${style.label}`}>{action}</p>
      ) : null}
    </div>
  );
}
