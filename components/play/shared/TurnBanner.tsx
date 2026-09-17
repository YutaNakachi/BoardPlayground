"use client";

type Props = {
  playerLabel: string;
  stats?: string;
  action?: string;
};

export function TurnBanner({ playerLabel, stats, action }: Props) {
  return (
    <div className="rounded-2xl border-2 border-accent/50 bg-accent/10 px-4 py-4 shadow-[0_0_24px_rgba(255,92,138,0.12)]">
      <div className="flex flex-wrap items-center gap-3">
        <span
          className="flex h-3 w-3 shrink-0 animate-pulse rounded-full bg-accent shadow-[0_0_8px_rgba(255,92,138,0.8)]"
          aria-hidden
        />
        <p className="font-display text-lg font-extrabold tracking-tight text-white sm:text-xl">
          <span className="text-accent">{playerLabel}</span>
          <span className="text-slate-200">の手番</span>
        </p>
      </div>
      {stats ? <p className="mt-2 pl-6 text-sm text-slate-400">{stats}</p> : null}
      {action ? (
        <p className="mt-1 pl-6 text-sm font-medium text-accent-warm">{action}</p>
      ) : null}
    </div>
  );
}
