import type { ReactNode } from "react";

/** 準備画面でブロック間の縦間隔（PlaySetupCard 直下の子要素） */
export const PLAY_SETUP_STACK_CLASS = "flex flex-col gap-8";

type Props = {
  title: string;
  description: string;
  children: ReactNode;
};

export function PlaySetupStack({ children }: { children: ReactNode }) {
  return <div className={PLAY_SETUP_STACK_CLASS}>{children}</div>;
}

type SectionProps = {
  label?: string;
  children: ReactNode;
  /** ラベル下の補足（小さめグレー） */
  hint?: ReactNode;
  className?: string;
};

/** ラベル + コントロール1組（ブロック内は gap-2） */
export function PlaySetupSection({
  label,
  children,
  hint,
  className,
}: SectionProps) {
  return (
    <section
      className={["flex flex-col gap-2", className].filter(Boolean).join(" ")}
    >
      {label ? (
        <p className="text-center text-xs text-slate-400">{label}</p>
      ) : null}
      {children}
      {hint ? (
        <div className="text-center text-xs text-slate-500">{hint}</div>
      ) : null}
    </section>
  );
}

export function PlaySetupCard({ title, description, children }: Props) {
  return (
    <div className="rounded-2xl border border-white/10 bg-surface-raised p-6 text-center sm:p-8">
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="mt-2 text-sm text-[#a1a1a6]">{description}</p>
      <div className={`mt-8 ${PLAY_SETUP_STACK_CLASS}`}>{children}</div>
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

/** オンライン未対応など、選択不可の pill */
export function setupPillDisabledClass(): string {
  return "min-h-11 cursor-not-allowed rounded-full bg-white/5 px-5 text-sm font-medium text-[#636366] opacity-60 ring-1 ring-white/10";
}
