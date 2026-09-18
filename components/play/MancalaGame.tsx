"use client";

import { usePlayPage } from "@/components/play/PlayPageContext";
import { useCallback, useMemo, useState } from "react";
import { ResultPanel } from "@/components/play/shared/ResultPanel";
import { SetupPanel } from "@/components/play/shared/SetupPanel";
import { TurnBanner } from "@/components/play/shared/TurnBanner";
import { winnerIndices } from "@/lib/game-engine";
import {
  initialMancala,
  isMancalaPit,
  sowMancala,
  type Player,
} from "@/lib/play/mancala";

type Phase = "setup" | "playing" | "game-over";

const P1_PITS = [0, 1, 2, 3, 4, 5];
const P2_PITS = [12, 11, 10, 9, 8, 7];

export function MancalaGame() {
  const { recordLocalPlay } = usePlayPage();
  const [phase, setPhase] = useState<Phase>("setup");
  const [pits, setPits] = useState<number[]>(initialMancala);
  const [current, setCurrent] = useState<Player>(0);
  const [notice, setNotice] = useState<string | null>(null);

  const startGame = useCallback(() => {
    recordLocalPlay();
    setPits(initialMancala());
    setCurrent(0);
    setNotice(null);
    setPhase("playing");
  }, [recordLocalPlay]);

  const playPit = useCallback(
    (index: number) => {
      if (phase !== "playing") return;
      const result = sowMancala(pits, current, index);
      if (!result) return;
      setPits(result.pits);
      if (result.over) {
        setPhase("game-over");
        setNotice(null);
        return;
      }
      if (result.extraTurn) {
        setNotice("最後の種が自分の倉に入ったので、もう一度");
        return;
      }
      setNotice(result.captured ? "向かいの種を取りました" : null);
      setCurrent(current === 0 ? 1 : 0);
    },
    [phase, pits, current]
  );

  const winners = useMemo(() => {
    if (phase !== "game-over") return null;
    return winnerIndices([pits[6], pits[13]]);
  }, [phase, pits]);

  if (phase === "setup") {
    return (
      <SetupPanel
        title="マンカラ・カラハ"
        description="自分の穴の種を反時計回りにまきます。最後が倉ならもう一度、空き穴なら向かいを取れます。"
        playerCount={2}
        playerOptions={[2]}
        onPlayerCount={() => {}}
        onStart={startGame}
      />
    );
  }

  if (phase === "game-over" && winners) {
    return (
      <ResultPanel
        winners={winners}
        onReplay={() => setPhase("setup")}
        details={
          <ul className="space-y-1 text-slate-400">
            <li>プレイヤー 1 の倉: {pits[6]} 個</li>
            <li>プレイヤー 2 の倉: {pits[13]} 個</li>
          </ul>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <TurnBanner
        playerIndex={current}
        playerLabel={`プレイヤー ${current + 1}`}
        stats={`倉 1: ${pits[6]} · 倉 2: ${pits[13]}`}
      />
      {notice ? <p className="text-center text-sm text-amber-200">{notice}</p> : null}

      <div className="mx-auto grid max-w-xl grid-cols-8 gap-1.5 sm:gap-2">
        <Store count={pits[13]} label="P2 倉" active={current === 1} />
        {P2_PITS.map((index) => (
          <PitButton
            key={index}
            count={pits[index]}
            label={`P2 穴`}
            playable={phase === "playing" && current === 1 && isMancalaPit(1, index) && pits[index] > 0}
            onClick={() => playPit(index)}
            opponent
          />
        ))}
        <Store count={pits[6]} label="P1 倉" active={current === 0} />
        {P1_PITS.map((index) => (
          <PitButton
            key={index}
            count={pits[index]}
            label={`P1 穴`}
            playable={phase === "playing" && current === 0 && isMancalaPit(0, index) && pits[index] > 0}
            onClick={() => playPit(index)}
          />
        ))}
      </div>

    </div>
  );
}

function Store({
  count,
  label,
  active,
}: {
  count: number;
  label: string;
  active: boolean;
}) {
  return (
    <div
      className={`row-span-2 flex min-h-28 flex-col items-center justify-center rounded-2xl border text-lg font-semibold sm:min-h-32 ${
        active ? "border-accent/70 bg-accent/10" : "border-surface-border bg-surface-raised"
      }`}
    >
      <span className="text-[10px] font-medium text-slate-500">{label}</span>
      <span className="text-2xl">{count}</span>
    </div>
  );
}

function PitButton({
  count,
  label,
  playable,
  onClick,
  opponent,
}: {
  count: number;
  label: string;
  playable: boolean;
  onClick: () => void;
  opponent?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={!playable}
      onClick={onClick}
      aria-label={`${label} ${count}個`}
      className={`flex min-h-16 flex-col items-center justify-center rounded-2xl border text-lg font-semibold transition sm:min-h-20 ${
        playable
          ? "border-accent bg-accent/15 text-white hover:bg-accent/25"
          : opponent
            ? "border-rose-500/30 bg-rose-950/30 text-rose-100"
            : "border-surface-border bg-surface-raised text-slate-200"
      } disabled:cursor-default`}
    >
      {count}
    </button>
  );
}