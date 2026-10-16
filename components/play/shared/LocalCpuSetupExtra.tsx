"use client";

import { CpuDifficultyPicker } from "@/components/play/shared/CpuDifficultyPicker";
import {
  LocalCpuHumanSeatPicker,
  type CpuSeatLabels,
} from "@/components/play/shared/LocalCpuHumanSeatPicker";
import { PlaySetupSection } from "@/components/play/shared/PlaySetupCard";
import type { LocalMatchSetupKind } from "@/components/play/shared/PlayModeLocalMatchTabs";
import type { BinaryPlayer, CpuDifficulty } from "@/lib/play/cpu/types";

type Props = {
  kind: LocalMatchSetupKind;
  difficulty: CpuDifficulty;
  onDifficultyChange: (value: CpuDifficulty) => void;
  humanSeat: BinaryPlayer;
  onHumanSeatChange: (seat: BinaryPlayer) => void;
  seatLabels?: CpuSeatLabels;
};

export function LocalCpuSetupExtra({
  kind,
  difficulty,
  onDifficultyChange,
  humanSeat,
  onHumanSeatChange,
  seatLabels,
}: Props) {
  if (kind !== "cpu") return null;
  return (
    <>
      <PlaySetupSection label="CPUの強さ">
        <CpuDifficultyPicker value={difficulty} onChange={onDifficultyChange} />
      </PlaySetupSection>
      <LocalCpuHumanSeatPicker
        humanSeat={humanSeat}
        onHumanSeatChange={onHumanSeatChange}
        labels={seatLabels}
      />
    </>
  );
}
