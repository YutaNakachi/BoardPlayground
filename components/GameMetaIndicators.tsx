import type { ReactNode } from "react";
import {
  COMPLEXITY_LABEL,
  type GameComplexity,
  type GameMeta,
} from "@/lib/games";

const ICON_CLASS = "h-4 w-4 shrink-0 text-slate-500";

type MetaItemProps = {
  icon: ReactNode;
  label: string;
  children: ReactNode;
  className?: string;
};

export function MetaItem({ icon, label, children, className = "" }: MetaItemProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-sm tabular-nums text-slate-400 ${className}`}
      aria-label={label}
    >
      <span className="inline-flex shrink-0" aria-hidden>{icon}</span>
      <span>{children}</span>
    </span>
  );
}

/** Signal bars: 1–3 filled by difficulty (easy / normal / hard). */
function ComplexityIcon({ level }: { level: GameComplexity }) {
  const filled =
    level === "easy" ? 1 : level === "normal" ? 2 : 3;
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={ICON_CLASS}>
      <rect x="4" y="14" width="4" height="6" rx="1" opacity={filled >= 1 ? 1 : 0.25} />
      <rect x="10" y="10" width="4" height="10" rx="1" opacity={filled >= 2 ? 1 : 0.25} />
      <rect x="16" y="6" width="4" height="14" rx="1" opacity={filled >= 3 ? 1 : 0.25} />
    </svg>
  );
}

function PlayersIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={ICON_CLASS}>
      <path d="M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm8 0a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM3 18.5c0-2.5 2.7-4 6-4s6 1.5 6 4V20H3v-1.5zM15 14.8c1.9.6 3.2 1.8 3.2 3.7V20h5v-1.5c0-2.3-2.4-3.8-5.5-3.7-.4.1-.8.3-1.2.5-.5.3-1 .5-1.5.5z" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={ICON_CLASS}>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v4l3 2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ComplexityMeta({
  complexity,
  className,
}: {
  complexity: GameComplexity;
  className?: string;
}) {
  const label = COMPLEXITY_LABEL[complexity];
  return (
    <MetaItem icon={<ComplexityIcon level={complexity} />} label={`難易度: ${label}`} className={className}>
      {label}
    </MetaItem>
  );
}

export function PlayersMeta({
  players,
  className,
}: {
  players: string;
  className?: string;
}) {
  return (
    <MetaItem icon={<PlayersIcon />} label={`プレイ人数: ${players}人`} className={className}>
      {players}人
    </MetaItem>
  );
}

export function DurationMeta({
  minutes,
  className,
}: {
  minutes: number;
  className?: string;
}) {
  return (
    <MetaItem icon={<ClockIcon />} label={`プレイ時間の目安: 約${minutes}分`} className={className}>
      約{minutes}分
    </MetaItem>
  );
}

export function GameMetaIndicators({
  game,
  className = "flex flex-wrap items-center gap-x-4 gap-y-1",
}: {
  game: GameMeta;
  className?: string;
}) {
  return (
    <div className={className}>
      <ComplexityMeta complexity={game.complexity} />
      <PlayersMeta players={game.players} />
      <DurationMeta minutes={game.durationMinutes} />
    </div>
  );
}

export function OnlineBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-500/20 px-2.5 py-1 text-xs font-medium text-emerald-200 backdrop-blur-sm ${className}`}
    >
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5 shrink-0" aria-hidden>
        <path d="M12 3C7.5 3 3.7 5.6 2 9.2c3.5-2.8 8.3-2.8 11.8 0 .5-.9 1.2-1.7 2-2.3C14.2 4.8 13.1 3 12 3zm0 4c-2.8 0-5.3 1.2-7.1 3.1 2.2 1.8 5.3 1.8 7.4 0 1.2-1 2.8-1.6 4.4-1.5-.9-1.2-2-2.2-3.3-2.9C14.8 6.4 13.4 6 12 6zm0 4c-1.5 0-2.9.5-4 1.4 1.3 1.1 3.2 1.1 4.5 0 .7-.6 1.6-.9 2.5-.9-.6-.7-1.3-1.3-2.1-1.7-.8-.4-1.6-.5-2.4-.5z" />
      </svg>
      オンライン可
    </span>
  );
}
