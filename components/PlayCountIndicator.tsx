import { formatPlayCount } from "@/lib/format-play-count";

type Props = {
  count: number;
  className?: string;
};

/** Play triangle + count (like ♥ for likes). */
export function PlayCountIndicator({ count, className = "" }: Props) {
  if (count <= 0) return null;

  return (
    <span
      className={`inline-flex items-center gap-1 text-sm tabular-nums text-slate-400 ${className}`}
      aria-label={`${formatPlayCount(count)}回プレイ`}
    >
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className="h-4 w-4 shrink-0 text-slate-500"
        aria-hidden
      >
        <path d="M8 5.14v13.72a1 1 0 0 0 1.5.86l10.04-5.86a1 1 0 0 0 0-1.72L9.5 4.28a1 1 0 0 0-1.5.86z" />
      </svg>
      <span>{formatPlayCount(count)}</span>
    </span>
  );
}
