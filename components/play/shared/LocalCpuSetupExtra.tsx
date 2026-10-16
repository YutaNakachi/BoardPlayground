"use client";

import { CpuDifficultyPicker } from "@/components/play/shared/CpuDifficultyPicker";
import { PlaySetupSection } from "@/components/play/shared/PlaySetupCard";
import type { LocalMatchSetupKind } from "@/components/play/shared/PlayModeLocalMatchTabs";
import type { CpuDifficulty } from "@/lib/play/cpu/types";

type Props = {
  kind: LocalMatchSetupKind;
  difficulty: CpuDifficulty;
  onDifficultyChange: (value: CpuDifficulty) => void;
};

export function LocalCpuSetupExtra({
  kind,
  difficulty,
  onDifficultyChange,
}: Props) {
  if (kind !== "cpu") return null;
  return (
    <PlaySetupSection label="CPUの強さ">
      <CpuDifficultyPicker
        value={difficulty}
        onChange={onDifficultyChange}
      />
    </PlaySetupSection>
  );
}
