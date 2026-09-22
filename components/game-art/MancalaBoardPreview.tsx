import { initialMancala } from "@/lib/play/mancala";

const P1_PITS = [0, 1, 2, 3, 4, 5];
const P2_PITS = [12, 11, 10, 9, 8, 7];

const P1_STORE = 6;
const P2_STORE = 13;

const SURFACE_RAISED = "#1c1826";
const SURFACE_BORDER = "#3d3550";
const LABEL = "#64748b";

const P1 = {
  fill: "#ff5c8a",
  surface: "rgba(255, 92, 138, 0.2)",
  surfaceBorder: "rgba(255, 92, 138, 0.3)",
  surfaceText: "#ff5c8a",
  sectionBg: "rgba(255, 92, 138, 0.05)",
  sectionBorder: "rgba(255, 92, 138, 0.6)",
  playableBg: "rgba(255, 92, 138, 0.15)",
};

const P2 = {
  fill: "#38bdf8",
  surface: "rgba(56, 189, 248, 0.2)",
  surfaceBorder: "rgba(56, 189, 248, 0.3)",
  surfaceText: "#7dd3fc",
  sectionBg: "rgba(56, 189, 248, 0.05)",
  sectionBorder: "rgba(56, 189, 248, 0.6)",
  playableBg: "rgba(56, 189, 248, 0.15)",
};

function defaultPreviewPits(): number[] {
  const pits = initialMancala();
  pits[0] = 4;
  pits[1] = 2;
  pits[2] = 5;
  pits[3] = 3;
  pits[4] = 4;
  pits[5] = 5;
  pits[P1_STORE] = 7;
  pits[7] = 3;
  pits[8] = 5;
  pits[9] = 2;
  pits[10] = 4;
  pits[11] = 6;
  pits[12] = 1;
  pits[P2_STORE] = 9;
  return pits;
}

type Props = {
  pits?: number[];
  current?: 0 | 1;
  highlightPit?: number;
  className?: string;
};

export function MancalaBoardPreview({
  pits = defaultPreviewPits(),
  current = 0,
  highlightPit = 2,
  className = "h-full w-full max-h-24 max-w-[10.5rem] drop-shadow-lg",
}: Props) {
  const gap = 3;
  const storeW = 20;
  const storeH = 66;
  const pitW = 17;
  const pitH = 28;
  const pitsStartX = storeW + gap;
  const rightStoreX = pitsStartX + pitW * 6 + gap * 5 + gap;

  return (
    <svg viewBox={`0 0 ${rightStoreX + storeW} 72`} className={className}>
      <Store
        x={0}
        y={3}
        width={storeW}
        height={storeH}
        count={pits[P2_STORE]}
        label="P2"
        active={current === 1}
        palette={P2}
      />
      {P2_PITS.map((pitIndex, column) => {
        const x = pitsStartX + column * (pitW + gap);
        return (
          <Pit
            key={pitIndex}
            x={x}
            y={5}
            width={pitW}
            height={pitH}
            count={pits[pitIndex]}
            palette={P2}
            highlighted={current === 1 && pitIndex === highlightPit && pits[pitIndex] > 0}
          />
        );
      })}
      <Store
        x={rightStoreX}
        y={3}
        width={storeW}
        height={storeH}
        count={pits[P1_STORE]}
        label="P1"
        active={current === 0}
        palette={P1}
      />
      {P1_PITS.map((pitIndex, column) => {
        const x = pitsStartX + column * (pitW + gap);
        return (
          <Pit
            key={pitIndex}
            x={x}
            y={39}
            width={pitW}
            height={pitH}
            count={pits[pitIndex]}
            palette={P1}
            highlighted={current === 0 && pitIndex === highlightPit && pits[pitIndex] > 0}
          />
        );
      })}
    </svg>
  );
}

function Store({
  x,
  y,
  width,
  height,
  count,
  label,
  active,
  palette,
}: {
  x: number;
  y: number;
  width: number;
  height: number;
  count: number;
  label: string;
  active: boolean;
  palette: typeof P1;
}) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={8}
        fill={active ? palette.sectionBg : SURFACE_RAISED}
        stroke={active ? palette.sectionBorder : SURFACE_BORDER}
        strokeWidth={1}
      />
      <text
        x={x + width / 2}
        y={y + 14}
        textAnchor="middle"
        fill={LABEL}
        fontSize={6}
        fontWeight={500}
      >
        {label}
      </text>
      <text
        x={x + width / 2}
        y={y + height / 2 + 8}
        textAnchor="middle"
        fill="#f8fafc"
        fontSize={13}
        fontWeight={600}
      >
        {count}
      </text>
    </g>
  );
}

function Pit({
  x,
  y,
  width,
  height,
  count,
  palette,
  highlighted,
}: {
  x: number;
  y: number;
  width: number;
  height: number;
  count: number;
  palette: typeof P1;
  highlighted: boolean;
}) {
  const fill = highlighted ? palette.playableBg : palette.surface;
  const stroke = highlighted ? palette.sectionBorder : palette.surfaceBorder;
  const textFill = highlighted ? "#ffffff" : palette.surfaceText;

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={8}
        fill={fill}
        stroke={stroke}
        strokeWidth={1}
      />
      <text
        x={x + width / 2}
        y={y + height / 2 + 4}
        textAnchor="middle"
        fill={textFill}
        fontSize={11}
        fontWeight={600}
      >
        {count}
      </text>
    </g>
  );
}
