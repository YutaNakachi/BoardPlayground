import { MetaItem } from "@/components/GameMetaIndicators";
import { formatPlayCount } from "@/lib/format-play-count";

type Props = {
  count: number;
  className?: string;
};

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 shrink-0 text-slate-500">
      <path d="M8 5.14v13.72a1 1 0 0 0 1.5.86l10.04-5.86a1 1 0 0 0 0-1.72L9.5 4.28a1 1 0 0 0-1.5.86z" />
    </svg>
  );
}

/** Play triangle + count (like ♥ for likes). */
export function PlayCountIndicator({ count, className = "" }: Props) {
  if (count <= 0) return null;

  return (
    <MetaItem
      icon={<PlayIcon />}
      label={`${formatPlayCount(count)}回プレイ`}
      className={className}
    >
      {formatPlayCount(count)}
    </MetaItem>
  );
}
