"use client";

import { usePlayPage } from "@/components/play/PlayPageContext";
import { usePlaySetupNavigation } from "@/components/play/usePlaySetupNavigation";
import { useCallback, useMemo, useState } from "react";
import { ResultPanel } from "@/components/play/shared/ResultPanel";
import { SetupPanel } from "@/components/play/shared/SetupPanel";
import { TurnBanner } from "@/components/play/shared/TurnBanner";
import { getPlayerTurnStyle } from "@/lib/player-colors";
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

  const backToSetup = useCallback(() => setPhase("setup"), []);
  usePlaySetupNavigation(phase === "setup", backToSetup);

  if (phase === "setup") {
    return (
      <SetupPanel
        title="マンカラ・カラハ"
        description="自分の穴の種を反時計回りにまきます。最後が倉ならもう一度、自分側の空き穴なら向かいの種も取れます。"
        playerCount={2}
        playerOptions={[2]}
        onPlayerCount={() => {}}
        onStart={startGame}
      />
    );
  }

  const isGameOver = phase === "game-over" && winners !== null;

  return (
    <div className="space-y-6">
      {!isGameOver && (
      <TurnBanner
        playerIndex={current}
        playerLabel={`プレイヤー ${current + 1}`}
      />
      )}
      {notice && !isGameOver ? <p className="text-center text-sm text-amber-200">{notice}</p> : null}

      <div className="mx-auto grid max-w-xl grid-cols-8 gap-1.5 sm:gap-2">
        <Store count={pits[13]} label="P2 倉" playerIndex={1} active={current === 1} />
        {P2_PITS.map((index) => (
          <PitButton
            key={index}
            count={pits[index]}
            label={`P2 穴`}
            playerIndex={1}
            playable={phase === "playing" && current === 1 && isMancalaPit(1, index) && pits[index] > 0}
            onClick={() => playPit(index)}
          />
        ))}
        <Store count={pits[6]} label="P1 倉" playerIndex={0} active={current === 0} />
        {P1_PITS.map((index) => (
          <PitButton
            key={index}
            count={pits[index]}
            label={`P1 穴`}
            playerIndex={0}
            playable={phase === "playing" && current === 0 && isMancalaPit(0, index) && pits[index] > 0}
            onClick={() => playPit(index)}
          />
        ))}
      </div>

      {isGameOver && winners && (
        <ResultPanel
          variant="inline"
          winners={winners}
          onReplay={() => setPhase("setup")}
          details={
            <ul className="space-y-1 text-slate-400">
              <li>プレイヤー 1 の倉: {pits[6]} 個</li>
              <li>プレイヤー 2 の倉: {pits[13]} 個</li>
            </ul>
          }
        />
      )}
    </div>
  );
}

function Store({
  count,
  label,
  playerIndex,
  active,
}: {
  count: number;
  label: string;
  playerIndex: number;
  active: boolean;
}) {
  const style = getPlayerTurnStyle(playerIndex);
  return (
    <div
      className={`row-span-2 flex min-h-28 flex-col items-center justify-center rounded-2xl border text-lg font-semibold sm:min-h-32 ${
        active
          ? `${style.sectionBorder} ${style.sectionBg}`
          : "border-surface-border bg-surface-raised"
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
  playerIndex,
  playable,
  onClick,
}: {
  count: number;
  label: string;
  playerIndex: number;
  playable: boolean;
  onClick: () => void;
}) {
  const style = getPlayerTurnStyle(playerIndex);
  return (
    <button
      type="button"
      disabled={!playable}
      onClick={onClick}
      aria-label={`${label} ${count}個`}
      className={`flex min-h-16 flex-col items-center justify-center rounded-2xl border text-lg font-semibold transition sm:min-h-20 ${
        playable
          ? `${style.sectionBorder} ${style.bg} text-white hover:brightness-110`
          : `${style.surfaceBorder} ${style.surface} ${style.surfaceText}`
      } disabled:cursor-default`}
    >
      {count}
    </button>
  );
}