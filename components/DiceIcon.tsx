type Props = {
  className?: string;
  size?: number;
};

const OUTLINE = "#6b5344";

/** 日本式サイコロ — 上面は赤い1の目、等角投影 */
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
      <path d="M7 12.5 16 17.5 16 27.5 7 22.5Z" fill="#e3e3e8" />
      <path d="M16 17.5 25 12.5 25 22.5 16 27.5Z" fill="#f5f5f7" />
      <path d="M16 6.5 25 11.5 16 16.5 7 11.5Z" fill="#ffffff" />
      <path
        d="M16 6.5 25 11.5 25 22.5 16 27.5 7 22.5 7 12.5 16 17.5 16 6.5 M16 17.5 25 12.5 M16 17.5 7 12.5 M7 11.5 16 16.5 25 11.5"
        stroke={OUTLINE}
        strokeWidth="1.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="16" cy="11.5" r="2.35" fill="#d63b3b" />
      <circle cx="9.9" cy="17.4" r="1.2" fill="#4a4a4f" />
      <circle cx="12.1" cy="19.4" r="1.2" fill="#4a4a4f" />
      <circle cx="9.9" cy="21.6" r="1.2" fill="#4a4a4f" />
      <circle cx="12.1" cy="23.6" r="1.2" fill="#4a4a4f" />
      <circle cx="19.3" cy="17.8" r="1.2" fill="#4a4a4f" />
      <circle cx="21.7" cy="21.8" r="1.2" fill="#4a4a4f" />
    </svg>
  );
}
