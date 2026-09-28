"use client";

import {
  setupPillClass,
  setupPillDisabledClass,
} from "@/components/play/shared/PlaySetupCard";

export type LocalMatchSetupKind = "pvp" | "cpu";

type Props = {
  kind: LocalMatchSetupKind;
  onKindChange: (kind: LocalMatchSetupKind) => void;
  cpuSupported: boolean;
};

export function PlayModeLocalMatchTabs({
  kind,
  onKindChange,
  cpuSupported,
}: Props) {
  const effectiveKind =
    !cpuSupported && kind === "cpu" ? "pvp" : kind;

  return (
    <div>
      <div className="flex justify-center gap-2">
        <button
          type="button"
          onClick={() => onKindChange("pvp")}
          className={setupPillClass(effectiveKind === "pvp")}
        >
          対人戦
        </button>
        <button
          type="button"
          disabled={!cpuSupported}
          aria-disabled={!cpuSupported}
          title={cpuSupported ? undefined : "このゲームはCPU未対応です"}
          onClick={() => {
            if (cpuSupported) onKindChange("cpu");
          }}
          className={
            cpuSupported
              ? setupPillClass(effectiveKind === "cpu")
              : setupPillDisabledClass()
          }
        >
          CPU戦
        </button>
      </div>
      {!cpuSupported ? (
        <p className="mt-2 text-center text-xs text-slate-500">CPU未対応</p>
      ) : null}
    </div>
  );
}
