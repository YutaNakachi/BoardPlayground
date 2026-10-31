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
  /** 実装としてオンライン対応しているゲーム（未対応ラベルを出さない） */
  onlineCapable?: boolean;
  /** バックエンド判定中は未対応ラベルを出さない */
  onlineStatusLoading?: boolean;
};

export function PlayModeLocalOnlineTabs({
  mode,
  onModeChange,
  onlineSupported,
  onlineCapable = false,
  onlineStatusLoading = false,
}: Props) {
  const effectiveMode =
    !onlineSupported && mode === "online" ? "local" : mode;
  const showUnsupportedHint =
    !onlineStatusLoading && !onlineCapable && !onlineSupported;

  return (
    <div>
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
            onlineCapable && !onlineSupported
              ? "オンライン機能は現在利用できません"
              : onlineSupported
                ? undefined
                : "このゲームはオンライン未対応です"
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
      {showUnsupportedHint ? (
        <p className="mt-2 text-center text-xs text-slate-500">
          オンライン未対応
        </p>
      ) : null}
    </div>
  );
}
