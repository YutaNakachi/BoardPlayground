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
  piece: string;
  pieceText: string;
  pieceRing: string;
  fill: string;
  surface: string;
  surfaceBorder: string;
  surfaceText: string;
};

export const PLAYER_TURN_STYLES: PlayerTurnStyle[] = [
  {
    border: "border-accent/70",
    bg: "bg-accent/15",
    dot: "bg-accent",
    dotShadow: "shadow-[0_0_10px_rgba(255,92,138,0.85)]",
    label: "text-accent",
    glow: "shadow-[0_0_28px_rgba(255,92,138,0.15)]",
    sectionBorder: "border-accent/60",
    sectionBg: "bg-accent/5",
    sectionRing: "ring-accent/30",
    piece: "bg-accent",
    pieceText: "text-white",
    pieceRing: "ring-accent/40",
    fill: "#ff5c8a",
    surface: "bg-accent/20",
    surfaceBorder: "border-accent/30",
    surfaceText: "text-accent",
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
    piece: "bg-sky-400",
    pieceText: "text-white",
    pieceRing: "ring-sky-400/40",
    fill: "#38bdf8",
    surface: "bg-sky-500/20",
    surfaceBorder: "border-sky-400/30",
    surfaceText: "text-sky-300",
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
    piece: "bg-emerald-400",
    pieceText: "text-white",
    pieceRing: "ring-emerald-400/40",
    fill: "#34d399",
    surface: "bg-emerald-500/20",
    surfaceBorder: "border-emerald-400/30",
    surfaceText: "text-emerald-300",
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
    piece: "bg-amber-400",
    pieceText: "text-amber-950",
    pieceRing: "ring-amber-400/40",
    fill: "#fbbf24",
    surface: "bg-amber-500/20",
    surfaceBorder: "border-amber-400/30",
    surfaceText: "text-amber-300",
  },
];

export function getPlayerTurnStyle(playerIndex: number): PlayerTurnStyle {
  return PLAYER_TURN_STYLES[playerIndex % PLAYER_TURN_STYLES.length];
}

export function getPlayerFill(playerIndex: number): string {
  return getPlayerTurnStyle(playerIndex).fill;
}

export function playerPieceClasses(playerIndex: number): string {
  const style = getPlayerTurnStyle(playerIndex);
  return `${style.piece} ${style.pieceText} ring-1 ${style.pieceRing}`;
}
