import {
  getNebulaPiece,
  rotateCells,
} from "@/lib/play/nebula-link";
import { getPlayerTurnStyle } from "@/lib/player-colors";

/** どの形状・回転でも収まる固定プレビュー枠（4×4） */
const PREVIEW_GRID = 4;

type Props = {
  pieceId: string;
  rotation?: number;
  playerIndex?: number;
  className?: string;
};

export function NebulaPiecePreview({
  pieceId,
  rotation = 0,
  playerIndex = 0,
  className = "",
}: Props) {
  const piece = getNebulaPiece(pieceId);
  if (!piece) return null;

  const rotated = rotateCells(piece.cells, rotation);
  let minR = 0;
  let maxR = 0;
  let minC = 0;
  let maxC = 0;
  for (const [r, c] of rotated) {
    minR = Math.min(minR, r);
    maxR = Math.max(maxR, r);
    minC = Math.min(minC, c);
    maxC = Math.max(maxC, c);
  }
  const rows = maxR - minR + 1;
  const cols = maxC - minC + 1;
  const offsetR = Math.floor((PREVIEW_GRID - rows) / 2);
  const offsetC = Math.floor((PREVIEW_GRID - cols) / 2);
  const filled = new Set(
    rotated.map(([r, c]) => `${r - minR + offsetR},${c - minC + offsetC}`)
  );
  const style = getPlayerTurnStyle(playerIndex);

  return (
    <div
      className={`grid shrink-0 grid-cols-4 gap-0.5 ${className}`}
      aria-hidden
    >
      {Array.from({ length: PREVIEW_GRID * PREVIEW_GRID }, (_, i) => {
        const r = Math.floor(i / PREVIEW_GRID);
        const c = i % PREVIEW_GRID;
        const on = filled.has(`${r},${c}`);
        return (
          <span
            key={i}
            className={`h-2.5 w-2.5 rounded-sm sm:h-3 sm:w-3 ${
              on ? style.piece : "bg-transparent"
            }`}
          />
        );
      })}
    </div>
  );
}
