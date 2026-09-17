type Props = {
  className?: string;
  size?: number;
};

/** 6の目 — 小さいサイズでもサイコロと認識しやすいフラット表示 */
export function DiceIcon({ className, size = 32 }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <rect x="3" y="3" width="26" height="26" rx="6" fill="#f5f5f7" />
      <rect
        x="3.75"
        y="3.75"
        width="24.5"
        height="24.5"
        rx="5.25"
        stroke="#d1d1d6"
        strokeWidth="0.75"
      />
      <circle cx="10" cy="10" r="2" fill="#1d1d1f" />
      <circle cx="22" cy="10" r="2" fill="#1d1d1f" />
      <circle cx="10" cy="16" r="2" fill="#1d1d1f" />
      <circle cx="22" cy="16" r="2" fill="#1d1d1f" />
      <circle cx="10" cy="22" r="2" fill="#1d1d1f" />
      <circle cx="22" cy="22" r="2" fill="#1d1d1f" />
    </svg>
  );
}
