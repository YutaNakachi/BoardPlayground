export type PlayerTurnStyle = {
  border: string;
  bg: string;
  dot: string;
  dotShadow: string;
  label: string;
  glow: string;
  sectionBorder: string;
  sectionBg: string;
  sectionRing: string;
};

export const PLAYER_TURN_STYLES: PlayerTurnStyle[] = [
  {
    border: "border-accent/70",
    bg: "bg-accent/15",
    dot: "bg-accent",
    dotShadow: "shadow-[0_0_10px_rgba(255,92,138,0.9)]",
    label: "text-accent",
    glow: "shadow-[0_0_28px_rgba(255,92,138,0.18)]",
    sectionBorder: "border-accent/60",
    sectionBg: "bg-accent/5",
    sectionRing: "ring-accent/30",
  },
  {
    border: "border-sky-400/70",
    bg: "bg-sky-500/15",
    dot: "bg-sky-400",
    dotShadow: "shadow-[0_0_10px_rgba(56,189,248,0.9)]",
    label: "text-sky-300",
    glow: "shadow-[0_0_28px_rgba(56,189,248,0.18)]",
    sectionBorder: "border-sky-400/60",
    sectionBg: "bg-sky-500/5",
    sectionRing: "ring-sky-400/30",
  },
  {
    border: "border-emerald-400/70",
    bg: "bg-emerald-500/15",
    dot: "bg-emerald-400",
    dotShadow: "shadow-[0_0_10px_rgba(52,211,153,0.9)]",
    label: "text-emerald-300",
    glow: "shadow-[0_0_28px_rgba(52,211,153,0.18)]",
    sectionBorder: "border-emerald-400/60",
    sectionBg: "bg-emerald-500/5",
    sectionRing: "ring-emerald-400/30",
  },
  {
    border: "border-amber-400/70",
    bg: "bg-amber-500/15",
    dot: "bg-amber-400",
    dotShadow: "shadow-[0_0_10px_rgba(251,191,36,0.9)]",
    label: "text-amber-300",
    glow: "shadow-[0_0_28px_rgba(251,191,36,0.18)]",
    sectionBorder: "border-amber-400/60",
    sectionBg: "bg-amber-500/5",
    sectionRing: "ring-amber-400/30",
  },
];

export function getPlayerTurnStyle(playerIndex: number): PlayerTurnStyle {
  return PLAYER_TURN_STYLES[playerIndex % PLAYER_TURN_STYLES.length];
}
