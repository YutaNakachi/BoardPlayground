"use client";

import {
  setupPillClass,
  setupPillDisabledClass,
} from "@/components/play/shared/PlaySetupCard";

export type SetupLocalOnlineMode = "local" | "online";

type Props = {
  mode: SetupLocalOnlineMode;
  onModeChange: (mode: SetupLocalOnlineMode) => void;
  onlineSupported: boolean;
};

export function PlayModeLocalOnlineTabs({
  mode,
  onModeChange,
  onlineSupported,
}: Props) {
  const effectiveMode =
    !onlineSupported && mode === "online" ? "local" : mode;

  return (
    <div className="flex justify-center gap-2">
      <button
        type="button"
        onClick={() => onModeChange("local")}
        className={setupPillClass(effectiveMode === "local")}
      >
        ローカル
      </button>
      <button
        type="button"
        disabled={!onlineSupported}
        aria-disabled={!onlineSupported}
        title={
          onlineSupported ? undefined : "このゲームはオンライン未対応です"
        }
        onClick={() => {
          if (onlineSupported) onModeChange("online");
        }}
        className={
          onlineSupported
            ? setupPillClass(effectiveMode === "online")
            : setupPillDisabledClass()
        }
      >
        オンライン
      </button>
    </div>
  );
}
