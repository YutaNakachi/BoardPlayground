import { OriginChip } from "@/components/OriginChip";
import { COMPLEXITY_LABEL, type GameMeta } from "@/lib/games";

type Props = {
  game: GameMeta;
  includeOrigin?: boolean;
  className?: string;
};

const chipClass =
  "rounded-md bg-surface-border/50 px-2 py-0.5 text-xs text-slate-400";

export function GameMetaChips({
  game,
  includeOrigin = false,
  className = "flex flex-wrap gap-1.5",
}: Props) {
  return (
    <div className={className}>
      {includeOrigin ? <OriginChip origin={game.origin} /> : null}
      <span className={chipClass}>{COMPLEXITY_LABEL[game.complexity]}</span>
      <span className={chipClass}>{game.players}人</span>
      <span className={chipClass}>約{game.durationMinutes}分</span>
      {game.cpu ? <span className={chipClass}>CPUあり</span> : null}
      {game.team ? <span className={chipClass}>チーム可</span> : null}
    </div>
  );
}
