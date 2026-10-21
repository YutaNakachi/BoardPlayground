"use client";

import { useCallback, useMemo, useState } from "react";
import { KingAndSpyDuelField } from "@/components/play/king-and-spy/KingAndSpyDuelField";
import { KingAndSpyMatchPanel } from "@/components/play/king-and-spy/KingAndSpyMatchPanel";
import { KingAndSpyPlayingCard } from "@/components/play/king-and-spy/KingAndSpyPlayingCard";
import { useKingAndSpyDuelField } from "@/components/play/king-and-spy/useKingAndSpyDuelField";
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
import { playerRoleLabel } from "@/lib/play/king-and-spy/labels";
import { roleForSeat } from "@/lib/play/king-and-spy/rules";
import {
  applyKingAndSpyCommit,
  decisivesUntilRoleSwap,
  initialKingAndSpyPublicState,
  initialKingAndSpySecrets,
  MATCH_MAX_ROUNDS,
} from "@/lib/play/king-and-spy/state";
import type {
  KingAndSpyCard,
  KingAndSpyPublicState,
  KingAndSpySecrets,
  KingAndSpyViewState,
} from "@/lib/play/king-and-spy/types";
import type { LocalMatchSetupKind } from "@/components/play/shared/PlayModeLocalMatchTabs";

const GAME_DESCRIPTION =
  "キングとスパイの非対称な三すくみカード。同時に1枚を出し、点差3点先取または12ラウンドで勝ちます。";

type LocalPhase = "setup" | "playing" | "game-over";

function toPublicState(view: KingAndSpyViewState): KingAndSpyPublicState {
  const {
    myHand: _h,
    mySeat: _s,
    myRole: _r,
    ...pub
  } = view;
  return {
    ...pub,
    roundNumber: pub.roundNumber ?? 1,
    maxRounds: pub.maxRounds ?? MATCH_MAX_ROUNDS,
    roundHistory: pub.roundHistory ?? [],
  };
}

export function KingAndSpyGame() {
  const { recordLocalPlay } = usePlayPage();
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
  const [myCommittedCard, setMyCommittedCard] = useState<KingAndSpyCard | null>(
    null
  );

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

  const duelPublic = useMemo(
    () =>
      activeView
        ? toPublicState(activeView)
        : initialKingAndSpyPublicState(0),
    [activeView]
  );

  const mySeat = isOnlinePlay
    ? (online.mySeat as 0 | 1)
    : localActiveSeat;

  const duelCommittedCard = duelPublic.committedReady[mySeat]
    ? myCommittedCard
    : null;

  const { field, resetField, isRevealPlayback } = useKingAndSpyDuelField(
    duelPublic,
    mySeat,
    duelCommittedCard
  );

  const myHandLive = activeView?.myHand ?? [];
  const [revealHandHold, setRevealHandHold] = useState<KingAndSpyCard[] | null>(
    null
  );
  const [revealHandLatch, setRevealHandLatch] = useState(false);
  if (isRevealPlayback) {
    if (!revealHandLatch) {
      setRevealHandLatch(true);
      setRevealHandHold(myHandLive);
    }
  } else if (revealHandLatch) {
    setRevealHandLatch(false);
    setRevealHandHold(null);
  }
  const displayHand =
    isRevealPlayback && revealHandHold !== null ? revealHandHold : myHandLive;

  const effectivePickedCardId = isRevealPlayback ? null : pickedCardId;

  const seatLabels: [string, string] = useMemo(() => {
    if (isOnlinePlay) {
      return [
        getSeatDisplayName(online.players, 0),
        getSeatDisplayName(online.players, 1),
      ];
    }
    return ["プレイヤー1", "プレイヤー2"];
  }, [isOnlinePlay, online.players]);

  const startLocal = useCallback(
    (_kind: LocalMatchSetupKind) => {
      recordLocalPlay();
      const kingRoleSeat = kingRoleSeatFromHost(0, hostStartsAsKingLocal);
      setPublicState(initialKingAndSpyPublicState(kingRoleSeat));
      setSecrets(initialKingAndSpySecrets(kingRoleSeat));
      setLocalActiveSeat(0);
      setPickedCardId(null);
      setMyCommittedCard(null);
      resetField();
      setLocalPhase("playing");
    },
    [recordLocalPlay, hostStartsAsKingLocal, resetField]
  );

  const resetLocal = useCallback(() => {
    setLocalPhase("setup");
    setPickedCardId(null);
    setMyCommittedCard(null);
    resetField();
  }, [resetField]);

  const commitLocal = useCallback(
    (seat: 0 | 1, card: KingAndSpyCard) => {
      const pub = structuredClone(publicState);
      const sec = structuredClone(secrets);
      const result = applyKingAndSpyCommit(pub, sec, seat, card.id);
      if (result.error) return;
      setPublicState(pub);
      setSecrets(sec);
      setPickedCardId(null);
      if (!pub.committedReady[0] && !pub.committedReady[1]) {
        setMyCommittedCard(null);
      }
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
    if (!pickedCardId || !activeView || isRevealPlayback) return;
    const card = activeView.myHand.find((c) => c.id === pickedCardId);
    if (!card) return;

    setMyCommittedCard(card);

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
    commitLocal(localActiveSeat, card);
  }, [
    pickedCardId,
    activeView,
    isOnlinePlay,
    online,
    localPhase,
    localActiveSeat,
    commitLocal,
    isRevealPlayback,
  ]);

  const isSetupScreen =
    (mode === "local" && localPhase === "setup") ||
    (mode === "online" && online.phase === "idle");
  usePlaySetupNavigation(isSetupScreen, resetLocal);

  if (online.completingPendingJoin) {
    return <PendingJoinConnecting />;
  }

  if (mode === "online" && online.phase === "idle" && onlineEnabled) {
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
                キング側
              </button>
              <button
                type="button"
                className={`px-4 py-2 ${setupPillClass(!hostStartsAsKingLocal)}`}
                onClick={() => setHostStartsAsKingLocal(false)}
              >
                スパイ側
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
                    キング側
                  </button>
                  <button
                    type="button"
                    className={`px-4 py-2 ${setupPillClass(!hostStartsAsKing)}`}
                    onClick={() => onHostStartsAsKingChange(false)}
                  >
                    スパイ側
                  </button>
                </div>
              ) : (
                <p className="text-center text-sm text-white">
                  ホストは
                  {hostStartsAsKing ? "キング側" : "スパイ側"}
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
                キング側
              </button>
              <button
                type="button"
                className={`px-4 py-2 ${setupPillClass(!hostStartsAsKingLocal)}`}
                onClick={() => setHostStartsAsKingLocal(false)}
              >
                スパイ側
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

  const isGameOver =
    (isOnlinePlay && online.phase === "finished") ||
    localPhase === "game-over" ||
    activeView.phase === "game-over";

  const alreadyCommitted = activeView.committedReady[mySeat];
  const opponentCommitted = activeView.committedReady[mySeat === 0 ? 1 : 0];

  const pub = toPublicState(activeView);
  const scores = pub.scores;
  const isDrawEnd = isGameOver && Boolean(activeView.draw);
  const winnerSeats =
    isGameOver && activeView.winner !== null ? [activeView.winner] : null;

  let stats: string;
  let action: string;
  let notice: string | undefined;

  if (isGameOver) {
    stats = `最終スコア ${scores[0]} – ${scores[1]}`;
    action = isDrawEnd ? "上限ラウンド終了・同点" : "マッチ終了";
    notice = undefined;
  } else {
    stats = `あなたは${playerRoleLabel(activeView.myRole)} · 担当交代まであと${decisivesUntilRoleSwap(activeView.decisiveCount)}決着`;
    action = "手札から1枚選び、確定する";
    if (isRevealPlayback) {
      action = "公開中… 次の手札は表示が終わってから";
    } else if (alreadyCommitted) {
      action = opponentCommitted
        ? "オープン…"
        : "場に裏向きで出しました。相手の確定を待っています";
    }
  }

  const replayProps = getOnlineResultReplayProps(
    isOnlinePlay,
    online.isHost,
    () => online.handleRematch({ gameOptions: { hostStartsAsKing } }),
    resetLocal
  );

  return (
    <div className="mx-auto w-full max-w-lg space-y-4">
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

      {isGameOver && isDrawEnd && (
        <ResultPanel
          draw
          winners={[]}
          winnersLabel="同点のため引き分け（上限ラウンド）"
          {...replayProps}
        />
      )}

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
        <KingAndSpyDuelField
          field={field}
          labels={seatLabels}
          mySeat={mySeat}
          lastReveal={activeView.lastReveal}
          roundHistory={pub.roundHistory}
        />
      )}

      {!isGameOver && (
        <div className="space-y-3">
          <p className="text-center text-sm text-slate-300">
            {isOnlinePlay
              ? "あなたの手札"
              : `プレイヤー${localActiveSeat + 1}の手札（相手に見えません）`}
          </p>
          <div
            className={`flex flex-wrap justify-center gap-3 ${isRevealPlayback ? "pointer-events-none opacity-50" : ""}`}
          >
            {displayHand.map((card) => (
              <KingAndSpyPlayingCard
                key={card.id}
                card={card}
                faceDown={false}
                flipped={true}
                size="hand"
                selected={effectivePickedCardId === card.id}
                disabled={alreadyCommitted || isRevealPlayback}
                onClick={
                  alreadyCommitted || isRevealPlayback
                    ? undefined
                    : () => setPickedCardId(card.id)
                }
              />
            ))}
          </div>
          <div className="flex justify-center">
            <button
              type="button"
              disabled={
                !effectivePickedCardId || alreadyCommitted || isRevealPlayback
              }
              onClick={handleCommit}
              className="rounded-lg bg-indigo-600 px-6 py-2 text-sm font-semibold text-white disabled:opacity-40"
            >
              場に出す（確定）
            </button>
          </div>
        </div>
      )}

      <KingAndSpyMatchPanel
        state={pub}
        seatLabels={seatLabels}
        mySeat={mySeat}
      />
    </div>
  );
}
