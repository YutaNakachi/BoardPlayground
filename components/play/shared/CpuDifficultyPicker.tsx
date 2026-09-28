"use client";

import { setupPillClass } from "@/components/play/shared/PlaySetupCard";
import type { CpuDifficulty } from "@/lib/play/senkai-senki/ai";

export type { CpuDifficulty };

const OPTIONS: { value: CpuDifficulty; label: string }[] = [
  { value: "easy", label: "初級" },
  { value: "normal", label: "中級" },
  { value: "hard", label: "上級" },
];

type Props = {
  value: CpuDifficulty;
  onChange: (value: CpuDifficulty) => void;
};

export function CpuDifficultyPicker({ value, onChange }: Props) {
  return (
    <div className="flex justify-center gap-2">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={setupPillClass(value === opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
