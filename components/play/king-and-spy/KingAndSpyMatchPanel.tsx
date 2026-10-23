"use client";

import { winningSideLabel } from "@/lib/play/king-and-spy/labels";
import type { KingAndSpyPublicState } from "@/lib/play/king-and-spy/types";

type Props = {
  state: KingAndSpyPublicState;
  seatLabels: [string, string];
  mySeat: 0 | 1;
};

export function KingAndSpyMatchPanel({ state, seatLabels, mySeat }: Props) {
  const { scores, roundNumber, maxRounds, roundHistory, kingRoleSeat } = state;

  return (
    <div className="space-y-3 rounded-2xl border border-slate-700/80 bg-slate-900/60 p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm font-semibold text-white">
          ラウンド {roundNumber} / {maxRounds}
        </p>
        <p className="text-xs text-slate-400">
          先に3点差、または{maxRounds}ラウンドで得点多い方
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {([0, 1] as const).map((seat) => (
          <div
            key={seat}
            className={`rounded-xl border px-3 py-3 ${
              seat === mySeat
                ? "border-indigo-500/50 bg-indigo-950/30"
                : "border-slate-700/60 bg-slate-950/40"
            }`}
          >
            <p className="truncate text-xs text-slate-400">{seatLabels[seat]}</p>
            <p className="mt-1 font-display text-2xl font-bold tabular-nums text-white">
              {scores[seat]}
              <span className="ml-1 text-sm font-normal text-slate-500">点</span>
            </p>
            {state.phase !== "game-over" && (
              <p className="mt-1 text-xs text-slate-300">
                {seat === kingRoleSeat ? (
                  <span className="text-amber-200">キング担当</span>
                ) : (
                  <span className="text-rose-200">スパイ担当</span>
                )}
              </p>
            )}
          </div>
        ))}
      </div>

      {roundHistory.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-medium text-slate-400">ラウンド履歴</p>
          <ul className="max-h-40 space-y-1 overflow-y-auto text-xs">
            {[...roundHistory].reverse().map((row) => (
              <li
                key={`${row.round}-${row.winnerSeat}-${row.winningSide}`}
                className="flex flex-wrap items-center gap-x-2 rounded-lg bg-slate-950/50 px-2 py-1.5 text-slate-300"
              >
                <span className="font-medium text-slate-200">R{row.round}</span>
                <span className="text-slate-500">
                  {seatLabels[row.kingSeat]}=キング · {seatLabels[row.spySeat]}
                  =スパイ
                </span>
                <span className="text-indigo-300">
                  → {seatLabels[row.winnerSeat]} +{row.pointsAwarded} ·{" "}
                  {winningSideLabel(row.winningSide)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
