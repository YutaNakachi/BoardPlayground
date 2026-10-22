"use client";

import {
  PlaySetupSection,
  setupPillClass,
} from "@/components/play/shared/PlaySetupCard";
import type { PlayerCountOption } from "@/lib/online/game-options";

type Props = {
  value: PlayerCountOption;
  options: readonly PlayerCountOption[];
  onChange: (count: PlayerCountOption) => void;
};

export function OnlinePlayerCountPicker({ value, options, onChange }: Props) {
  return (
    <PlaySetupSection label="人数">
      <div className="flex flex-wrap justify-center gap-2">
        {options.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`min-w-14 px-4 py-2 ${setupPillClass(value === n)}`}
          >
            {n}人
          </button>
        ))}
      </div>
    </PlaySetupSection>
  );
}
