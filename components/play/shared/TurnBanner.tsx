"use client";

import { getPlayerTurnStyle } from "@/lib/player-colors";

type Props = {
  playerIndex: number;
  playerLabel: string;
  stats?: string;
  action?: string;
  notice?: string;
};

export function TurnBanner({
  playerIndex,
  playerLabel,
  stats,
  action,
  notice,
}: Props) {
  const style = getPlayerTurnStyle(playerIndex);
  const hasSubtitle = Boolean(stats || action || notice);

  return (
    <div
      className={`rounded-2xl border-2 px-4 py-4 ${style.border} ${style.bg} ${style.glow}`}
    >
      <div className="grid grid-cols-[auto_11rem_auto] items-center gap-x-3 gap-y-2">
        <span
          className={`row-start-1 flex h-3.5 w-3.5 shrink-0 animate-pulse rounded-full ${style.dot} ${style.dotShadow}`}
          aria-hidden
        />
        <span
          className={`row-start-1 truncate font-display text-lg font-extrabold tracking-tight tabular-nums sm:text-xl ${style.label}`}
        >
          {playerLabel}
        </span>
        <span className="row-start-1 shrink-0 font-display text-lg font-extrabold tracking-tight text-slate-200 sm:text-xl">
          の手番
        </span>
        <p
          className={`col-start-2 col-span-2 row-start-2 h-5 truncate text-sm leading-5 ${
            hasSubtitle ? "" : "invisible"
          }`}
        >
          {stats ? <span className="text-slate-400">{stats}</span> : null}
          {stats && (action || notice) ? (
            <span className="text-slate-500"> · </span>
          ) : null}
          {action ? (
            <span className={`font-medium ${style.label}`}>{action}</span>
          ) : null}
          {(stats || action) && notice ? (
            <span className="text-slate-500"> · </span>
          ) : null}
          {notice ? <span className="text-amber-200">{notice}</span> : null}
          {!hasSubtitle ? "\u00A0" : null}
        </p>
      </div>
    </div>
  );
}
