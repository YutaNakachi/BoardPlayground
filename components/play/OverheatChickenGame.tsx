"use client";

import { useCallback, useState } from "react";
import { usePlayPage } from "@/components/play/PlayPageContext";
import { usePlaySetupNavigation } from "@/components/play/usePlaySetupNavigation";
import { OverheatGlass } from "@/components/play/overheat-chicken/OverheatGlass";
import { ResultPanel } from "@/components/play/shared/ResultPanel";
import {
  PlaySetupSection,
  setupPillClass,
} from "@/components/play/shared/PlaySetupCard";
import { SetupPanel } from "@/components/play/shared/SetupPanel";
import { TurnBanner } from "@/components/play/shared/TurnBanner";
import {
  CHIP_LABEL,
  CHIP_SIZES,
  createOverheat,
  endTurn,
  MAX_CHIPS_PER_TURN,
  placeChip,
  tensionNotice,
  type ChipSize,
  type OverheatState,
  type PlayerId,
} from "@/lib/play/overheat-chicken";

type Phase = "setup" | "playing" | "game-over";

function playerLabel(player: PlayerId): string {
  return `プレイヤー ${player + 1}`;
}

export function OverheatChickenGame() {
  const { recordLocalPlay } = usePlayPage();
  const [phase, setPhase] = useState<Phase>("setup");
  const [firstPlayer, setFirstPlayer] = useState<PlayerId>(0);
  const [state, setState] = useState<OverheatState | null>(null);

  const backToSetup = useCallback(() => {
    setPhase("setup");
    setState(null);
  }, []);
  usePlaySetupNavigation(phase === "setup", backToSetup);

  const startGame = useCallback(() => {
    recordLocalPlay();
    setState(createOverheat(firstPlayer));
    setPhase("playing");
  }, [firstPlayer, recordLocalPlay]);

  const place = useCallback(
    (size: ChipSize) => {
      if (!state || phase !== "playing") return;
      const next = placeChip(state, size);
      if (!next) return;
      setState(next);
      if (next.winner !== null) setPhase("game-over");
    },
    [phase, state]
  );

  const finishTurn = useCallback(() => {
    if (!state || phase !== "playing") return;
    const next = endTurn(state);
    if (!next) return;
    setState(next);
  }, [phase, state]);

  if (phase === "setup" || !state) {
    return (
      <SetupPanel
        title="オーバーヒート・チキンレース"
        description="縁まで満たした杯に、小・中・大のチップを入れます。終えるときはボタンを押します。水を溢れさせた方が負けです。"
        playerCount={2}
        onPlayerCount={() => {}}
        playerOptions={[2]}
        onStart={startGame}
        extra={
          <PlaySetupSection label="先手">
            <div className="flex justify-center gap-2">
              {([0, 1] as const).map((player) => (
                <button
                  key={player}
                  type="button"
                  onClick={() => setFirstPlayer(player)}
                  className={setupPillClass(firstPlayer === player)}
                >
                  {playerLabel(player)}
                </button>
              ))}
            </div>
          </PlaySetupSection>
        }
      />
    );
  }

  const over = phase === "game-over" && state.winner !== null;
  const notice = tensionNotice(state);
  const glassLabel = over ? "杯。水が溢れた。" : "杯。チップを入れている。";
  const action =
    state.placed <= 0
      ? "サイズを選ぶ"
      : state.placed >= MAX_CHIPS_PER_TURN
        ? "手番を終える"
        : "続けるか、手番を終える";

  return (
    <div className="space-y-6">
      {over && state.winner !== null ? (
        <ResultPanel
          variant="inline"
          winners={[state.winner]}
          onReplay={backToSetup}
          details={<p className="text-sm text-slate-400">水が溢れた。</p>}
        />
      ) : null}

      {!over ? (
        <TurnBanner
          playerIndex={state.current}
          playerLabel={playerLabel(state.current)}
          action={action}
          notice={notice || undefined}
        />
      ) : null}

      <div className="mx-auto flex min-h-10 max-w-md flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-slate-400">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-accent" aria-hidden />
          プレイヤー 1
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-sky-400" aria-hidden />
          プレイヤー 2
        </span>
      </div>

      <OverheatGlass state={state} label={glassLabel} />

      {!over ? (
        <div className="flex flex-wrap items-end justify-center gap-3">
          {CHIP_SIZES.map((size) => {
            const px = size === "s" ? 46 : size === "m" ? 60 : 76;
            return (
              <button
                key={size}
                type="button"
                aria-label={CHIP_LABEL[size]}
                disabled={state.placed >= MAX_CHIPS_PER_TURN}
                onClick={() => place(size)}
                className="rounded-full p-0.5 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
              >
                <img
                  src={`/games/overheat-chicken/chip-${state.current}.png`}
                  alt=""
                  width={px}
                  height={px}
                  draggable={false}
                  className="pointer-events-none block select-none"
                />
              </button>
            );
          })}
          <button
            type="button"
            disabled={state.placed < 1}
            onClick={finishTurn}
            className="min-h-12 min-w-[7.5rem] rounded-2xl border border-white/25 bg-white/10 px-4 py-3 text-base font-bold text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white/10"
          >
            手番を終える
          </button>
        </div>
      ) : null}
    </div>
  );
}
