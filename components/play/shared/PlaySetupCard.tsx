import type { ReactNode } from "react";

type Props = {
  title: string;
  description: string;
  children: ReactNode;
};

export function PlaySetupCard({ title, description, children }: Props) {
  return (
    <div className="rounded-2xl border border-white/10 bg-surface-raised p-6 text-center sm:p-8">
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="mt-2 text-sm text-[#a1a1a6]">{description}</p>
      <div className="mt-6">{children}</div>
    </div>
  );
}

export function setupPillClass(active: boolean): string {
  return `min-h-11 rounded-full px-5 text-sm font-medium transition ${
    active
      ? "bg-[#f5f5f7] text-[#1d1d1f]"
      : "bg-white/10 text-[#c7c7cc] ring-1 ring-white/10 hover:bg-white/15"
  }`;
}
