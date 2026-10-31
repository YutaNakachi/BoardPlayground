"use client";

import {
  PlaySetupSection,
  setupPillClass,
} from "@/components/play/shared/PlaySetupCard";
import { getSeatDisplayName } from "@/lib/online/player-labels";
import type { RoomPlayer } from "@/lib/online/types";
import type { FirstPlayerSeat } from "@/lib/online/game-options";

type Props = {
  players: RoomPlayer[];
  value: number;
  seatCount?: number;
  onChange?: (seat: number) => void;
  readOnly?: boolean;
};

export function OnlineFirstPlayerPicker({
  players,
  value,
  seatCount = 2,
  onChange,
  readOnly = false,
}: Props) {
  const seats = Array.from({ length: seatCount }, (_, i) => i);

  return (
    <PlaySetupSection label={seatCount > 2 ? "先攻" : "先手"}>
      {readOnly ? (
        <p className="text-center text-sm font-medium text-white">
          {getSeatDisplayName(players, value)}
        </p>
      ) : (
        <div className="flex flex-wrap justify-center gap-2">
          {seats.map((seat) => (
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
      )}
    </PlaySetupSection>
  );
}
