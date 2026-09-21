import { getPlayerFill } from "@/lib/player-colors";
import type { Player } from "@/lib/play/mini-shogi";

type Props = {
  label: string;
  player: Player;
  promoted?: boolean;
  size?: "board" | "hand";
  className?: string;
};

const SHOGI_PIECE_SYMBOL: Record<Player, string> = {
  0: "☖",
  1: "☗",
};

export function ShogiPieceTile({
  label,
  player,
  size = "board",
  className = "",
}: Props) {
  const isHand = size === "hand";
  const pieceColor = getPlayerFill(player);
  const symbolSize = isHand ? "text-2xl" : "text-[2.25rem] sm:text-[2.75rem]";
  const charCount = label.length;
  const labelSize =
    charCount >= 2
      ? isHand
        ? "text-[8px] leading-[1.1]"
        : "text-[9px] leading-[1.15] sm:text-[10px]"
      : isHand
        ? "text-[11px] leading-none"
        : "text-sm leading-none sm:text-base";

  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center ${
        isHand ? "h-9 w-7" : "h-11 w-9 sm:h-12 sm:w-10"
      } ${player === 1 ? "rotate-180" : ""} ${className}`}
    >
      <span
        className={`absolute select-none leading-none drop-shadow ${symbolSize}`}
        style={{ color: pieceColor }}
        aria-hidden
      >
        {SHOGI_PIECE_SYMBOL[player]}
      </span>
      <span
        className={`relative z-10 font-bold text-slate-900 ${labelSize} [text-orientation:upright] [writing-mode:vertical-rl] ${
          isHand ? "rounded-sm bg-white/95 px-px shadow-sm" : ""
        }`}
      >
        {label}
      </span>
    </span>
  );
}
