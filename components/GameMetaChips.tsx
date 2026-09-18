import { OriginChip } from "@/components/OriginChip";
import { META_CHIP_CLASS, ONLINE_CHIP_CLASS } from "@/lib/chip-styles";
import { formatPlayCount } from "@/lib/format-play-count";
import { COMPLEXITY_LABEL, type GameMeta } from "@/lib/games";
import { isOnlineGame } from "@/lib/online/types";

type Props = {
  game: GameMeta;
  includeOrigin?: boolean;
  className?: string;
  playCount?: number;
};

export function GameMetaChips({
  game,
  includeOrigin = false,
  className = "flex flex-wrap gap-1.5",
  playCount,
}: Props) {

  return (
    <div className={className}>
      {includeOrigin ? <OriginChip origin={game.origin} /> : null}
      <span className={META_CHIP_CLASS}>{COMPLEXITY_LABEL[game.complexity]}</span>
      <span className={META_CHIP_CLASS}>{game.players}人</span>
      <span className={META_CHIP_CLASS}>約{game.durationMinutes}分</span>
      {playCount != null && playCount > 0 ? (
        <span className={META_CHIP_CLASS}>{formatPlayCount(playCount)}回プレイ</span>
      ) : null}
      {isOnlineGame(game.slug) ? (
        <span className={ONLINE_CHIP_CLASS}>オンライン可</span>
      ) : null}
      {game.cpu ? <span className={META_CHIP_CLASS}>CPUあり</span> : null}
      {game.team ? <span className={META_CHIP_CLASS}>チーム可</span> : null}
    </div>
  );
}
