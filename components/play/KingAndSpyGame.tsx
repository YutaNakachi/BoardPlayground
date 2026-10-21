"use client";

import { useCallback, useMemo, useState } from "react";
import { usePlayPage } from "@/components/play/PlayPageContext";
import { usePlaySetupNavigation } from "@/components/play/usePlaySetupNavigation";
import { OnlineSetupPanel } from "@/components/play/shared/OnlineSetupPanel";
import { PendingJoinConnecting } from "@/components/play/shared/PendingJoinConnecting";
import { ResultPanel } from "@/components/play/shared/ResultPanel";
import { setupPillClass } from "@/components/play/shared/PlaySetupCard";
import { TurnBanner } from "@/components/play/shared/TurnBanner";
import { usePlayStats } from "@/components/PlayStatsProvider";
import { useOnlineKingRole } from "@/hooks/useOnlineKingRole";
import { useOnlineRoom } from "@/hooks/useOnlineRoom";
import { isKingAndSpyViewState } from "@/lib/online/project-state";
import { getOnlineResultReplayProps } from "@/lib/online/result-replay";
import {
  formatWinnersWithNames,
  getSeatDisplayName,
} from "@/lib/online/player-labels";
import type { PlayMode } from "@/lib/online/types";
import { kingRoleSeatFromHost } from "@/lib/play/king-and-spy/game-options";
import { roleForSeat } from "@/lib/play/king-and-spy/rules";
import {
  applyKingAndSpyCommit,
  decisivesUntilRoleSwap,
  initialKingAndSpyPublicState,
  initialKingAndSpySecrets,
} from "@/lib/play/king-and-spy/state";
import type {
  KingAndSpyCard,
  KingAndSpyPublicState,
  KingAndSpySecrets,
  KingAndSpyViewState,
} from "@/lib/play/king-and-spy/types";
import type { LocalMatchSetupKind } from "@/components/play/shared/PlayModeLocalMatchTabs";

const GAME_DESCRIPTION =
  "首領と刺客の非対称な三すくみカード。同時に1枚を出し、点差3点先取で勝ちます。";

const KIND_LABEL: Record<KingAndSpyCard["kind"], string> = {
  king: "首領",
  citizen: "市民",
  spy: "刺客",
};

type LocalPhase = "setup" | "playing" | "game-over";

function roleLabel(role: "king" | "spy") {
  return role === "king" ? "首領側" : "刺客側";
}

function CardChip({
  card,
  onClick,
  selected,
  disabled,
}: {
  card: KingAndSpyCard;
  onClick?: () => void;
  selected?: boolean;
  disabled?: boolean;
}) {
  const base =
    "rounded-lg border px-3 py-2 text-sm font-medium transition-colors";
  const kindStyle =
    card.kind === "king"
      ? "border-amber-500/60 bg-amber-950/40 text-amber-100"
      : card.kind === "spy"
        ? "border-rose-500/60 bg-rose-950/40 text-rose-100"
        : "border-slate-500/60 bg-slate-800/80 text-slate-100";
  if (onClick && !disabled) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${base} ${kindStyle} ${selected ? "ring-2 ring-indigo-400" : ""}`}
      >
        {KIND_LABEL[card.kind]}
      </button>
    );
  }
  return <span className={`${base} ${kindStyle} opacity-90`}>{KIND_LABEL[card.kind]}</span>;
}

export function KingAndSpyGame() {
  const { recordLocalPlay, setPlayMode } = usePlayPage();
  const { onlineEnabled } = usePlayStats();
  const online = useOnlineRoom("king-and-spy");
  const { hostStartsAsKing, onHostStartsAsKingChange } =
    useOnlineKingRole(online);

  const [mode, setMode] = useState<PlayMode>("local");
  const [localPhase, setLocalPhase] = useState<LocalPhase>("setup");
  const [hostStartsAsKingLocal, setHostStartsAsKingLocal] = useState(true);
  const [publicState, setPublicState] = useState<KingAndSpyPublicState>(() =>
    initialKingAndSpyPublicState(0)
  );
  const [secrets, setSecrets] = useState<KingAndSpySecrets>(() =>
    initialKingAndSpySecrets(0)
  );
  const [localActiveSeat, setLocalActiveSeat] = useState<0 | 1>(0);
  const [pickedCardId, setPickedCardId] = useState<string | null>(null);

  const isOnlinePlay =
    online.phase === "playing" || online.phase === "finished";

  const onlineView: KingAndSpyViewState | null = useMemo(() => {
    if (!isOnlinePlay || !online.gameState) return null;
    const s = online.gameState;
    if (!isKingAndSpyViewState(s)) return null;
    return s;
  }, [isOnlinePlay, online.gameState]);

  const activeView: KingAndSpyViewState | null = useMemo(() => {
    if (isOnlinePlay) return onlineView;
    if (localPhase === "playing" || localPhase === "game-over") {
      return {
        ...publicState,
        myHand: secrets.hands[localActiveSeat],
        mySeat: localActiveSeat,
        myRole: roleForSeat(localActiveSeat, publicState.kingRoleSeat),
      };
    }
    return null;
  }, [
    isOnlinePlay,
    onlineView,
    localPhase,
    publicState,
    secrets,
    localActiveSeat,
  ]);

  const startLocal = useCallback(
    (_kind: LocalMatchSetupKind) => {
      recordLocalPlay();
      const kingRoleSeat = kingRoleSeatFromHost(0, hostStartsAsKingLocal);
      setPublicState(initialKingAndSpyPublicState(kingRoleSeat));
      setSecrets(initialKingAndSpySecrets(kingRoleSeat));
      setLocalActiveSeat(0);
      setPickedCardId(null);
      setLocalPhase("playing");
    },
    [recordLocalPlay, setPlayMode, hostStartsAsKingLocal]
  );

  const resetLocal = useCallback(() => {
    setLocalPhase("setup");
    setPickedCardId(null);
  }, []);

  const commitLocal = useCallback(
    (seat: 0 | 1, cardId: string) => {
      const pub = structuredClone(publicState);
      const sec = structuredClone(secrets);
      const result = applyKingAndSpyCommit(pub, sec, seat, cardId);
      if (result.error) return;
      setPublicState(pub);
      setSecrets(sec);
      setPickedCardId(null);
      if (pub.phase === "game-over") {
        setLocalPhase("game-over");
        return;
      }
      if (!pub.committedReady[0] && !pub.committedReady[1]) {
        setLocalActiveSeat(0);
      } else {
        setLocalActiveSeat(seat === 0 ? 1 : 0);
      }
    },
    [publicState, secrets]
  );

  const handleCommit = useCallback(() => {
    if (!pickedCardId || !activeView) return;
    if (isOnlinePlay && online.mySeat >= 0) {
      if (activeView.committedReady[online.mySeat]) return;
      void online.handleMove({
        type: "king-and-spy-commit",
        cardId: pickedCardId,
      });
      setPickedCardId(null);
      return;
    }
    if (localPhase !== "playing") return;
    commitLocal(localActiveSeat, pickedCardId);
  }, [
    pickedCardId,
    activeView,
    isOnlinePlay,
    online,
    localPhase,
    localActiveSeat,
    commitLocal,
  ]);

  const isSetupScreen =
    (mode === "local" && localPhase === "setup") ||
    (mode === "online" && online.phase === "idle");
  usePlaySetupNavigation(isSetupScreen, resetLocal);

  if (online.completingPendingJoin) {
    return <PendingJoinConnecting />;
  }

  if (
    mode === "online" &&
    online.phase === "idle" &&
    onlineEnabled
  ) {
    return (
      <OnlineSetupPanel
        title="キング＆スパイ（仮）"
        description={GAME_DESCRIPTION}
        mode={mode}
        onModeChange={setMode}
        onlineSupported={onlineEnabled}
        onCreateRoom={(displayName) => online.handleCreate(displayName)}
        onJoinRoom={(code, name) => online.handleJoin(code, name)}
        onStartLocal={startLocal}
        loading={online.loading}
        initialJoinCode={online.joinCodeFromUrl}
        error={online.error}
        extra={() => (
          <div className="space-y-2">
            <p className="text-center text-xs text-slate-400">開始時の側（P1）</p>
            <div className="flex justify-center gap-2">
              <button
                type="button"
                className={`px-4 py-2 ${setupPillClass(hostStartsAsKingLocal)}`}
                onClick={() => setHostStartsAsKingLocal(true)}
              >
                首領側
              </button>
              <button
                type="button"
                className={`px-4 py-2 ${setupPillClass(!hostStartsAsKingLocal)}`}
                onClick={() => setHostStartsAsKingLocal(false)}
              >
                刺客側
              </button>
            </div>
          </div>
        )}
      />
    );
  }

  if (online.phase === "waiting" && online.room) {
    return (
      <OnlineSetupPanel
        title="キング＆スパイ（仮）"
        description={GAME_DESCRIPTION}
        mode="online"
        onModeChange={() => {}}
        onlineSupported={onlineEnabled}
        onCreateRoom={() => {}}
        onJoinRoom={() => {}}
        onStartLocal={() => {}}
        loading={online.loading}
        error={online.error}
        waiting={{
          code: online.room.code,
          players: online.players,
          isHost: online.isHost,
          onStart: () =>
            online.handleStart({ gameOptions: { hostStartsAsKing } }),
          canStart: online.players.length >= 2,
          extra: (
            <div className="space-y-2">
              <p className="text-center text-xs text-slate-400">
                ホストの開始側
              </p>
              {online.isHost ? (
                <div className="flex justify-center gap-2">
                  <button
                    type="button"
                    className={`px-4 py-2 ${setupPillClass(hostStartsAsKing)}`}
                    onClick={() => onHostStartsAsKingChange(true)}
                  >
                    首領側
                  </button>
                  <button
                    type="button"
                    className={`px-4 py-2 ${setupPillClass(!hostStartsAsKing)}`}
                    onClick={() => onHostStartsAsKingChange(false)}
                  >
                    刺客側
                  </button>
                </div>
              ) : (
                <p className="text-center text-sm text-white">
                  ホストは
                  {hostStartsAsKing ? "首領側" : "刺客側"}
                  で開始
                </p>
              )}
            </div>
          ),
        }}
      />
    );
  }

  if (mode === "local" && localPhase === "setup") {
    return (
      <OnlineSetupPanel
        title="キング＆スパイ（仮）"
        description={GAME_DESCRIPTION}
        mode={mode}
        onModeChange={setMode}
        onlineSupported={onlineEnabled}
        onCreateRoom={(displayName) => online.handleCreate(displayName)}
        onJoinRoom={(code, name) => online.handleJoin(code, name)}
        onStartLocal={startLocal}
        loading={online.loading}
        error={online.error}
        extra={() => (
          <div className="space-y-2">
            <p className="text-center text-xs text-slate-400">P1の開始側</p>
            <div className="flex justify-center gap-2">
              <button
                type="button"
                className={`px-4 py-2 ${setupPillClass(hostStartsAsKingLocal)}`}
                onClick={() => setHostStartsAsKingLocal(true)}
              >
                首領側
              </button>
              <button
                type="button"
                className={`px-4 py-2 ${setupPillClass(!hostStartsAsKingLocal)}`}
                onClick={() => setHostStartsAsKingLocal(false)}
              >
                刺客側
              </button>
            </div>
          </div>
        )}
      />
    );
  }

  if (!activeView) {
    return null;
  }

  const scores = activeView.scores;
  const margin = Math.abs(scores[0] - scores[1]);
  const isGameOver =
    (isOnlinePlay && online.phase === "finished") ||
    localPhase === "game-over" ||
    activeView.phase === "game-over";

  const mySeat = isOnlinePlay ? (online.mySeat as 0 | 1) : localActiveSeat;
  const alreadyCommitted = activeView.committedReady[mySeat];
  const opponentCommitted = activeView.committedReady[mySeat === 0 ? 1 : 0];

  const stats = `スコア ${scores[0]} – ${scores[1]}（差 ${margin}） · あなたは${roleLabel(activeView.myRole)} · 交代まであと${decisivesUntilRoleSwap(activeView.decisiveCount)}決着`;

  let action = "手札から1枚選び、確定する";
  let notice: string | undefined;
  if (alreadyCommitted) {
    action = opponentCommitted ? "公開中…" : "相手の確定を待っています";
  }
  if (activeView.lastReveal) {
    const lr = activeView.lastReveal;
    notice = `公開: ${KIND_LABEL[lr.cards[0].kind]} vs ${KIND_LABEL[lr.cards[1].kind]} → ${lr.winningSide === "king-side" ? "首領側" : "刺客側"}決着（+${lr.pointsAwarded}）`;
  }

  const winnerSeats =
    isGameOver && activeView.winner !== null ? [activeView.winner] : null;

  const replayProps = getOnlineResultReplayProps(
    isOnlinePlay,
    online.isHost,
    () => online.handleRematch({ gameOptions: { hostStartsAsKing } }),
    resetLocal
  );

  return (
    <div className="mx-auto w-full max-w-lg space-y-4">
      {isGameOver && winnerSeats && (
        <ResultPanel
          winners={winnerSeats}
          winnersLabel={
            isOnlinePlay
              ? formatWinnersWithNames(online.players, winnerSeats)
              : `プレイヤー${winnerSeats[0] + 1}`
          }
          {...replayProps}
        />
      )}

      {!isGameOver && (
        <TurnBanner
          playerIndex={mySeat}
          playerLabel={
            isOnlinePlay
              ? getSeatDisplayName(online.players, mySeat)
              : `プレイヤー${mySeat + 1}`
          }
          stats={stats}
          action={action}
          notice={notice}
        />
      )}

      <div className="rounded-xl border border-slate-700/80 bg-slate-900/50 p-3">
        <p className="text-xs text-slate-400">捨て札</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {activeView.discards.length === 0 ? (
            <span className="text-sm text-slate-500">なし</span>
          ) : (
            activeView.discards.map((c) => <CardChip key={c.id} card={c} />)
          )}
        </div>
      </div>

      {!isGameOver && (
        <div className="space-y-3">
          <p className="text-center text-sm text-slate-300">
            {isOnlinePlay
              ? "あなたの手札"
              : `プレイヤー${localActiveSeat + 1}の手札（相手に見えません）`}
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {activeView.myHand.map((card) => (
              <CardChip
                key={card.id}
                card={card}
                selected={pickedCardId === card.id}
                disabled={alreadyCommitted}
                onClick={
                  alreadyCommitted
                    ? undefined
                    : () => setPickedCardId(card.id)
                }
              />
            ))}
          </div>
          <div className="flex justify-center">
            <button
              type="button"
              disabled={!pickedCardId || alreadyCommitted}
              onClick={handleCommit}
              className="rounded-lg bg-indigo-600 px-6 py-2 text-sm font-semibold text-white disabled:opacity-40"
            >
              確定
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
