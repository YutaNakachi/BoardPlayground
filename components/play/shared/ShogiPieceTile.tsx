import { getPlayerFill } from "@/lib/player-colors";
import type { Player } from "@/lib/play/mini-shogi";

type Props = {
  label: string;
  player: Player;
  promoted?: boolean;
  size?: "board" | "hand";
  className?: string;
};

/** 将棋駒形（上向き）。後手は外枠で 180° 回転 */
const KOMA_POINTS = "20,1 37,16 32,45 8,45 3,16";

export function ShogiPieceTile({
  label,
  player,
  size = "board",
  className = "",
}: Props) {
  const isHand = size === "hand";
  const pieceColor = getPlayerFill(player);
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
      <svg
        viewBox="0 0 40 48"
        className="absolute inset-0 h-full w-full drop-shadow-sm"
        aria-hidden
      >
        <polygon
          points={KOMA_POINTS}
          fill={pieceColor}
          stroke="rgba(15, 23, 42, 0.35)"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
      </svg>
      <span
        className={`relative z-10 max-h-[70%] overflow-hidden font-bold text-slate-900 ${labelSize} [text-orientation:upright] [writing-mode:vertical-rl]`}
      >
        {label}
      </span>
    </span>
  );
}
