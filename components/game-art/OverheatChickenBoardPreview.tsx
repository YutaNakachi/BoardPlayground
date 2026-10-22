"use client";

import { OverheatGlass } from "@/components/play/overheat-chicken/OverheatGlass";
import {
  createOverheat,
  endTurn,
  placeChip,
  type OverheatState,
} from "@/lib/play/overheat-chicken";

/** カード用：杯にチップが積まれ、水面がふくらみ始めた中盤 */
function midGamePreviewState(): OverheatState {
  const random = () => 0.55;
  let state = createOverheat(0, { capacity: 17, random });
  state = placeChip(state, "m")!;
  state = endTurn(state)!;
  state = placeChip(state, "s")!;
  state = endTurn(state)!;
  state = placeChip(state, "l")!;
  state = placeChip(state, "m")!;
  state = endTurn(state)!;
  state = placeChip(state, "s")!;
  state = placeChip(state, "s")!;
  return state;
}

const PREVIEW_STATE = midGamePreviewState();

type Props = {
  className?: string;
};

export function OverheatChickenBoardPreview({
  className = "h-full w-full max-h-24 max-w-24 drop-shadow-lg",
}: Props) {
  return (
    <div
      className={`flex items-center justify-center overflow-hidden ${className}`}
      aria-hidden
    >
      <div className="w-[min(100%,9rem)] origin-center scale-[0.95]">
        <OverheatGlass state={PREVIEW_STATE} label="オーバーヒート・チキンレース" />
      </div>
    </div>
  );
}
