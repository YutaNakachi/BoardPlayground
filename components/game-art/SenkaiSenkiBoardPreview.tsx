import {
  initialSenkaiSenki,
  SS_COLS,
  ssCoord,
  type SenkaiState,
} from "@/lib/play/senkai-senki";
import { getPlayerFill } from "@/lib/player-colors";

const FACING_DEG: Record<0 | 1 | 2 | 3, number> = {
  0: 0,
  1: 90,
  2: 180,
  3: 270,
};

const TOKEN_SRC: Record<string, string> = {
  light: "/games/senkai-senki/senkai-light-token.png",
  heavy: "/games/senkai-senki/senkai-heavy-token.png",
  scout: "/games/senkai-senki/senkai-scout-token.png",
  command: "/games/senkai-senki/senkai-command-token.png",
};

type Props = {
  state?: SenkaiState;
  className?: string;
};

export function SenkaiSenkiBoardPreview({
  state = initialSenkaiSenki(),
  className = "h-full w-full max-h-24 max-w-24 drop-shadow-lg",
}: Props) {
  return (
    <div
      className={`grid gap-0.5 rounded-lg border border-slate-700/80 bg-slate-900/60 p-1 ${className}`}
      style={{ gridTemplateColumns: `repeat(${SS_COLS}, minmax(0, 1fr))` }}
      aria-hidden
    >
      {state.cells.map((pieceId, index) => {
        const piece = pieceId === null ? null : state.pieces[pieceId];
        const { row, col } = ssCoord(index);
        const isLight = (row + col) % 2 === 0;

        return (
          <div
            key={index}
            className={`flex aspect-square min-h-0 items-center justify-center rounded-[2px] ${
              isLight ? "bg-slate-800/70" : "bg-slate-900/80"
            }`}
          >
            {piece ? (
              <div
                className="h-[88%] w-[88%]"
                style={{
                  backgroundColor: getPlayerFill(piece.owner),
                  WebkitMaskImage: `url(${TOKEN_SRC[piece.type]})`,
                  maskImage: `url(${TOKEN_SRC[piece.type]})`,
                  WebkitMaskSize: "contain",
                  maskSize: "contain",
                  WebkitMaskRepeat: "no-repeat",
                  maskRepeat: "no-repeat",
                  WebkitMaskPosition: "center",
                  maskPosition: "center",
                  transform:
                    piece.type === "command"
                      ? undefined
                      : `rotate(${FACING_DEG[piece.facing]}deg)`,
                  filter: "drop-shadow(0 1px 1px rgb(0 0 0 / 0.45))",
                }}
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
