import { OriginChip } from "@/components/OriginChip";
import { META_CHIP_CLASS, ONLINE_CHIP_CLASS } from "@/lib/chip-styles";
import { COMPLEXITY_LABEL, type GameMeta } from "@/lib/games";

type Props = {
  game: GameMeta;
  includeOrigin?: boolean;
  className?: string;
  showOnlineChip?: boolean;
};

export function GameMetaChips({
  game,
  includeOrigin = false,
  className = "flex flex-wrap gap-1.5",
  showOnlineChip = false,
}: Props) {
  return (
    <div className={className}>
      {includeOrigin ? <OriginChip origin={game.origin} /> : null}
      <span className={META_CHIP_CLASS}>{COMPLEXITY_LABEL[game.complexity]}</span>
      <span className={META_CHIP_CLASS}>{game.players}人</span>
      <span className={META_CHIP_CLASS}>約{game.durationMinutes}分</span>
      {showOnlineChip ? (
        <span className={ONLINE_CHIP_CLASS}>オンライン可</span>
      ) : null}
      {game.cpu ? <span className={META_CHIP_CLASS}>CPUあり</span> : null}
      {game.team ? <span className={META_CHIP_CLASS}>チーム可</span> : null}
    </div>
  );
}
