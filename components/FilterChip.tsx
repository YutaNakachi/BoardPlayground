type Props = {
  label: string;
  active: boolean;
  onClick: () => void;
  layout?: "inline" | "stack";
};

export function FilterChip({
  label,
  active,
  onClick,
  layout = "inline",
}: Props) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`min-h-10 text-sm transition ${
        layout === "stack"
          ? "w-full rounded-lg px-3 py-2 text-left"
          : "shrink-0 rounded-full px-4"
      } ${
        active
          ? "bg-accent font-medium text-white"
          : "bg-surface-raised text-slate-300 ring-1 ring-surface-border hover:text-white"
      }`}
    >
      {label}
    </button>
  );
}
