import {
  getNebulaPiece,
  rotateCells,
} from "@/lib/play/nebula-link";
import { getPlayerTurnStyle } from "@/lib/player-colors";

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
  const filled = new Set(
    rotated.map(([r, c]) => `${r - minR},${c - minC}`)
  );
  const style = getPlayerTurnStyle(playerIndex);

  return (
    <div
      className={`inline-grid gap-0.5 ${className}`}
      style={{
        gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
      }}
      aria-hidden
    >
      {Array.from({ length: rows * cols }, (_, i) => {
        const r = Math.floor(i / cols);
        const c = i % cols;
        const on = filled.has(`${r},${c}`);
        return (
          <span
            key={i}
            className={`h-3 w-3 rounded-sm sm:h-3.5 sm:w-3.5 ${
              on ? style.piece : "bg-transparent"
            }`}
          />
        );
      })}
    </div>
  );
}
