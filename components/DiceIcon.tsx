type Props = {
  className?: string;
  size?: number;
};

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
      <circle cx="10.5" cy="10.5" r="2.25" fill="#1d1d1f" />
      <circle cx="21.5" cy="10.5" r="2.25" fill="#1d1d1f" />
      <circle cx="16" cy="16" r="2.25" fill="#1d1d1f" />
      <circle cx="10.5" cy="21.5" r="2.25" fill="#1d1d1f" />
      <circle cx="21.5" cy="21.5" r="2.25" fill="#1d1d1f" />
    </svg>
  );
}
