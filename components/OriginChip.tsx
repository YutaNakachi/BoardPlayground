import { ORIGIN_LABEL, type GameOrigin } from "@/lib/games";
import { ORIGIN_CHIP_CLASS } from "@/lib/origin-styles";

type Props = {
  origin: GameOrigin;
  className?: string;
};

export function OriginChip({ origin, className = "" }: Props) {
  return (
    <span
      className={`rounded-md px-2 py-0.5 text-xs font-medium ${ORIGIN_CHIP_CLASS[origin]} ${className}`}
    >
      {ORIGIN_LABEL[origin]}
    </span>
  );
}
