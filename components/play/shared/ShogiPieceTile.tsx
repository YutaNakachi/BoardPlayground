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
  promoted = false,
  size = "board",
  className = "",
}: Props) {
  const isHand = size === "hand";
  const symbolSize = isHand ? "text-2xl" : "text-[2.25rem] sm:text-[2.75rem]";
  const labelSize =
    label.length >= 2
      ? isHand
        ? "text-[9px]"
        : "text-[10px] sm:text-xs"
      : isHand
        ? "text-xs"
        : "text-sm sm:text-base";

  return (
    <span
      className={`relative inline-flex items-center justify-center ${
        isHand ? "h-9 w-7" : "h-11 w-9 sm:h-12 sm:w-10"
      } ${className}`}
    >
      <span
        className={`absolute select-none leading-none text-amber-50 drop-shadow ${symbolSize}`}
        aria-hidden
      >
        {SHOGI_PIECE_SYMBOL[player]}
      </span>
      <span
        className={`relative z-10 font-bold leading-none text-slate-900 ${labelSize} ${
          promoted ? "text-rose-800" : ""
        } ${player === 1 ? "rotate-180" : ""}`}
      >
        {label}
      </span>
    </span>
  );
}
