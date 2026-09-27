"use client";

import { setupPillClass } from "@/components/play/shared/PlaySetupCard";

export type LocalCpuSetupKind = "local" | "cpu";

type Props = {
  kind: LocalCpuSetupKind;
  onKindChange: (kind: LocalCpuSetupKind) => void;
};

export function PlayModeLocalCpuTabs({ kind, onKindChange }: Props) {
  return (
    <div className="flex justify-center gap-2">
      <button
        type="button"
        onClick={() => onKindChange("local")}
        className={setupPillClass(kind === "local")}
      >
        同画面2人
      </button>
      <button
        type="button"
        onClick={() => onKindChange("cpu")}
        className={setupPillClass(kind === "cpu")}
      >
        CPU対戦
      </button>
    </div>
  );
}
