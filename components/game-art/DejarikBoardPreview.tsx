"use client";

import { DejarikBoard } from "@/components/play/dejarik/DejarikBoard";
import { outerIndex } from "@/lib/play/dejarik/board";
import {
  applyPlacement,
  initialDejarik,
  placementPlayer,
  type DejarikState,
} from "@/lib/play/dejarik/state";

/** カード用：両者がホーム半円に4体ずつ並べ終わった局面 */
function postPlacementPreviewState(): DejarikState {
  let state = initialDejarik(0);
  const cellsByStep = [
    outerIndex(3),
    outerIndex(9),
    outerIndex(5),
    outerIndex(11),
    outerIndex(7),
    outerIndex(1),
    outerIndex(4),
    outerIndex(10),
  ];
  for (let step = 0; step < 8; step++) {
    const player = placementPlayer(step, state.firstPlayer);
    const type = state.unplaced[player][0];
    const cell = cellsByStep[step];
    const next = applyPlacement(state, type, cell);
    if (!next) {
      throw new Error(`dejarik preview placement failed at step ${step}`);
    }
    state = next;
  }
  return state;
}

const PREVIEW_STATE = postPlacementPreviewState();

type Props = {
  className?: string;
};

export function DejarikBoardPreview({
  className = "h-full w-full max-h-24 max-w-24 drop-shadow-lg",
}: Props) {
  return (
    <div className={className} aria-hidden>
      <DejarikBoard
        state={PREVIEW_STATE}
        highlightCells={new Set()}
        highlightPlayer={0}
        selectedPieceId={null}
        onPointerDown={() => {}}
      />
    </div>
  );
}
