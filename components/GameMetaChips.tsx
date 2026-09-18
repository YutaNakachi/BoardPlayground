import { OriginChip } from "@/components/OriginChip";
import { GameMetaIndicators } from "@/components/GameMetaIndicators";
import { META_CHIP_CLASS } from "@/lib/chip-styles";
import type { GameMeta } from "@/lib/games";

type Props = {
  game: GameMeta;
  includeOrigin?: boolean;
  className?: string;
};

export function GameMetaChips({
  game,
  includeOrigin = false,
  className = "flex flex-wrap items-center gap-x-4 gap-y-2",
}: Props) {
  return (
    <div className={className}>
      {includeOrigin ? <OriginChip origin={game.origin} /> : null}
      <GameMetaIndicators game={game} className="contents" />
      {game.cpu ? <span className={META_CHIP_CLASS}>CPUあり</span> : null}
      {game.team ? <span className={META_CHIP_CLASS}>チーム可</span> : null}
    </div>
  );
}
