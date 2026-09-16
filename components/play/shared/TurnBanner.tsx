"use client";

type Props = {
  left: string;
  right: string;
};

export function TurnBanner({ left, right }: Props) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-surface-border bg-surface-raised px-4 py-3">
      <span className="text-sm text-slate-400">{left}</span>
      <span className="rounded-full bg-accent/20 px-3 py-1 text-sm font-medium text-accent">
        {right}
      </span>
    </div>
  );
}
