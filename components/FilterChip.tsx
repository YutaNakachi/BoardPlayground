type Props = {
  label: string;
  active: boolean;
  onClick: () => void;
};

export function FilterChip({ label, active, onClick }: Props) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`min-h-11 rounded-full px-4 text-sm transition ${
        active
          ? "bg-accent font-medium text-white"
          : "bg-surface-raised text-slate-300 ring-1 ring-surface-border hover:text-white"
      }`}
    >
      {label}
    </button>
  );
}
