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
  applyDrop,
  CAPACITY_MAX,
  CAPACITY_MIN,
  createOverheat,
  MAX_DROP,
  MIN_DROP,
  overflowCoinNumber,
  tensionNotice,
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

  const drop = useCallback(
    (count: number) => {
      if (!state || phase !== "playing") return;
      const next = applyDrop(state, count);
      if (!next) return;
      setState(next);
      if (next.winner !== null) setPhase("game-over");
    },
    [phase, state]
  );

  if (phase === "setup" || !state) {
    return (
      <SetupPanel
        title="オーバーヒート・チキンレース"
        description="縁まで満たした杯に、コインを1〜3枚ずつ入れます。水を溢れさせた方が負けです。"
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
  const brokeAt = overflowCoinNumber(state);
  const glassLabel = over
    ? `杯。上限は${state.capacity}枚。${brokeAt}枚目で水が溢れた。`
    : `杯。コイン${state.fill}枚。${tensionNotice(state)}`;

  return (
    <div className="space-y-6">
      {over && state.winner !== null && brokeAt !== null ? (
        <ResultPanel
          variant="inline"
          winners={[state.winner]}
          onReplay={backToSetup}
          details={
            <p className="text-sm text-slate-400">
              上限は{state.capacity}枚。{brokeAt}枚目で溢れた。
            </p>
          }
        />
      ) : null}

      {!over ? (
        <TurnBanner
          playerIndex={state.current}
          playerLabel={playerLabel(state.current)}
          stats={`コイン ${state.fill} 枚`}
          action="1〜3枚"
          notice={tensionNotice(state)}
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
        <span>
          上限は{CAPACITY_MIN}〜{CAPACITY_MAX}枚
        </span>
      </div>

      <OverheatGlass state={state} label={glassLabel} />

      {!over ? (
        <div className="flex flex-wrap justify-center gap-3">
          {Array.from(
            { length: MAX_DROP - MIN_DROP + 1 },
            (_, index) => MIN_DROP + index
          ).map((count) => (
            <button
              key={count}
              type="button"
              onClick={() => drop(count)}
              className="min-h-12 min-w-[5.5rem] rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-base font-bold text-white transition hover:bg-white/10"
            >
              {count}枚
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
