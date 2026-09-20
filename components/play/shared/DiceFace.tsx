type DiceFaceProps = {
  value: number;
  size?: "sm" | "md" | "lg";
  rolling?: boolean;
  className?: string;
};

const PIP_GRID: Record<number, boolean[]> = {
  1: [0, 0, 0, 0, 1, 0, 0, 0, 0],
  2: [1, 0, 0, 0, 0, 0, 0, 0, 1],
  3: [1, 0, 0, 0, 1, 0, 0, 0, 1],
  4: [1, 0, 1, 0, 0, 0, 1, 0, 1],
  5: [1, 0, 1, 0, 1, 0, 1, 0, 1],
  6: [1, 0, 1, 1, 0, 1, 1, 0, 1],
};

const SIZE_CLASS = {
  sm: "h-10 w-10 rounded-lg p-1.5",
  md: "h-14 w-14 rounded-xl p-2",
  lg: "h-20 w-20 rounded-2xl p-2.5",
} as const;

const PIP_CLASS = {
  sm: "h-1.5 w-1.5",
  md: "h-2 w-2",
  lg: "h-2.5 w-2.5",
} as const;

export function DiceFace({ value, size = "md", rolling = false, className = "" }: DiceFaceProps) {
  const face = Math.min(6, Math.max(1, Math.round(value)));
  const pips = PIP_GRID[face];

  return (
    <div
      className={`grid grid-cols-3 grid-rows-3 gap-0.5 bg-gradient-to-br from-white to-slate-100 shadow-[0_4px_14px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.9)] ring-1 ring-black/10 ${SIZE_CLASS[size]} ${
        rolling ? "animate-dice-shake" : ""
      } ${className}`}
      aria-label={`サイコロの出目 ${face}`}
    >
      {pips.map((on, i) => (
        <span key={i} className="flex items-center justify-center">
          {on ? (
            <span
              className={`rounded-full bg-slate-900 shadow-[inset_0_1px_1px_rgba(255,255,255,0.25)] ${PIP_CLASS[size]} ${
                face === 1 ? "bg-red-600" : ""
              }`}
            />
          ) : null}
        </span>
      ))}
    </div>
  );
}
