"use client";

import { setupPillClass } from "@/components/play/shared/PlaySetupCard";
import { getSeatDisplayName } from "@/lib/online/player-labels";
import type { HoundsSeat } from "@/lib/online/game-options";
import type { RoomPlayer } from "@/lib/online/types";

type Props = {
  players: RoomPlayer[];
  value: HoundsSeat;
  onChange?: (seat: HoundsSeat) => void;
  readOnly?: boolean;
};

export function OnlineHoundsSeatPicker({
  players,
  value,
  onChange,
  readOnly = false,
}: Props) {
  const hareSeat: HoundsSeat = value === 0 ? 1 : 0;

  return (
    <div className="space-y-2">
      <p className="text-center text-xs text-slate-400">猟犬</p>
      {readOnly ? (
        <p className="text-center text-sm font-medium text-white">
          {getSeatDisplayName(players, value)}が猟犬
          <span className="mt-1 block text-xs font-normal text-slate-500">
            {getSeatDisplayName(players, hareSeat)}がウサギ
          </span>
        </p>
      ) : (
        <>
          <div className="flex flex-wrap justify-center gap-2">
            {([0, 1] as const).map((seat) => (
              <button
                key={seat}
                type="button"
                onClick={() => onChange?.(seat)}
                className={`min-w-24 px-4 py-2 ${setupPillClass(value === seat)}`}
              >
                {getSeatDisplayName(players, seat)}
              </button>
            ))}
          </div>
          <p className="text-center text-xs text-slate-500">
            {getSeatDisplayName(players, value)}が猟犬 →{" "}
            {getSeatDisplayName(players, hareSeat)}がウサギ
          </p>
        </>
      )}
    </div>
  );
}
