"use client";

type Props = {
  eyebrow?: string;
  title: string;
  description: string;
  onContinue: () => void;
  continueLabel?: string;
};

export function HandoffGate({
  eyebrow,
  title,
  description,
  onContinue,
  continueLabel = "手番を開始",
}: Props) {
  return (
    <div className="rounded-2xl border border-surface-border bg-surface-raised p-6 text-center sm:p-8">
      {eyebrow ? <p className="text-sm text-slate-400">{eyebrow}</p> : null}
      <h2 className={`text-2xl font-bold ${eyebrow ? "mt-4" : ""}`}>{title}</h2>
      <p className="mt-3 text-sm text-slate-400">{description}</p>
      <button
        type="button"
        onClick={onContinue}
        className="btn-game mt-8 w-full sm:w-auto"
      >
        {continueLabel}
      </button>
    </div>
  );
}
