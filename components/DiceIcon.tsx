type Props = {
  className?: string;
  size?: number;
};

/** 斜めから見たサイコロ（上面＋側面） */
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
      <path d="M7 12.5 16 17.5 16 27.5 7 22.5Z" fill="#a8a8ad" />
      <path d="M16 17.5 25 12.5 25 22.5 16 27.5Z" fill="#c7c7cc" />
      <path d="M16 6.5 25 11.5 16 16.5 7 11.5Z" fill="#f5f5f7" />
      <path
        d="M16 6.5 25 11.5 16 16.5 7 11.5Z"
        stroke="#d1d1d6"
        strokeWidth="0.5"
        strokeLinejoin="round"
      />
      <circle cx="12.2" cy="12.8" r="1.35" fill="#1d1d1f" />
      <circle cx="16" cy="14.3" r="1.35" fill="#1d1d1f" />
      <circle cx="19.8" cy="15.8" r="1.35" fill="#1d1d1f" />
    </svg>
  );
}
