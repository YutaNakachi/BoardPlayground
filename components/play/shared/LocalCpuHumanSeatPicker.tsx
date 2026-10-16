"use client";

import { PlaySetupSection, setupPillClass } from "@/components/play/shared/PlaySetupCard";
import type { BinaryPlayer } from "@/lib/play/cpu/types";

export type CpuSeatLabels = {
  first: string;
  second: string;
};

const DEFAULT_LABELS: CpuSeatLabels = {
  first: "先手",
  second: "後手",
};

type Props = {
  humanSeat: BinaryPlayer;
  onHumanSeatChange: (seat: BinaryPlayer) => void;
  labels?: CpuSeatLabels;
};

export function LocalCpuHumanSeatPicker({
  humanSeat,
  onHumanSeatChange,
  labels = DEFAULT_LABELS,
}: Props) {
  return (
    <PlaySetupSection label="あなたの手番">
      <div className="flex justify-center gap-2">
        <button
          type="button"
          onClick={() => onHumanSeatChange(0)}
          className={setupPillClass(humanSeat === 0)}
        >
          {labels.first}
        </button>
        <button
          type="button"
          onClick={() => onHumanSeatChange(1)}
          className={setupPillClass(humanSeat === 1)}
        >
          {labels.second}
        </button>
      </div>
    </PlaySetupSection>
  );
}
