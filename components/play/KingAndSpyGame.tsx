"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
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
import { coerceKingAndSpyView } from "@/lib/online/project-state";
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
  applyKingAndSpyHandReady,
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
  "漫画『賭博黙示録カイジ』のEカードをモチーフにした三すくみカード。裏向きで出し、揃ってから公開。先に3点差をつけるか、12ラウンドで得点の多い方が勝ち。";

/** 場に出てから、手札の表示を減らすまで */
const HAND_REMOVE_MS = 450;
/** 両者のカードが裏で揃い、手札減らしも見えてから公開へ進むまで */
const BOTH_VISIBLE_MS = 500;
/** 相手がまだ出していないとき、減った手札を見せてから交代するまで */
const SOLO_HAND_MS = 400;

type HandPin = {
  seat: 0 | 1;
  cards: KingAndSpyCard[];
  cardId: string;
  gen: number;
};

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
  const [myCommittedCard, setMyCommittedCard] = useState<KingAndSpyCard | null>(
    null
  );
  const [pin, setPin] = useState<HandPin | null>(null);
  const [pinRelease, setPinRelease] = useState(false);
  const [revealGeneration, setRevealGeneration] = useState(0);
  const revealBusy = useRef(false);
  const ackFlight = useRef(false);
  const viewRef = useRef<KingAndSpyViewState | null>(null);
  const publicRef = useRef(publicState);
  const secretsRef = useRef(secrets);
  const isOnlineRef = useRef(false);
  const localPhaseRef = useRef(localPhase);
  const onlineMoveRef = useRef(online.handleMove);
  const revealGenerationRef = useRef(0);
  const aliveRef = useRef(true);

  const isOnlinePlay =
    online.phase === "playing" || online.phase === "finished";

  useEffect(() => {
    if (
      online.room?.code &&
      (online.phase === "waiting" ||
        online.phase === "playing" ||
        online.phase === "finished")
    ) {
      setPlayMode({ mode: "online", roomCode: online.room.code });
    } else if (localPhase === "playing" || localPhase === "game-over") {
      setPlayMode({ mode: "local" });
    }
  }, [online.room?.code, online.phase, localPhase, setPlayMode]);

  const onlineView: KingAndSpyViewState | null = useMemo(() => {
    if (!isOnlinePlay || !online.gameState) return null;
    const seat = online.mySeat === 1 ? 1 : 0;
    return coerceKingAndSpyView(online.gameState, seat);
  }, [isOnlinePlay, online.gameState, online.mySeat]);

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

  const finishShowcase = useCallback(() => {
    setMyCommittedCard(null);
    if (!isOnlineRef.current) {
      setLocalActiveSeat(publicRef.current.kingRoleSeat);
      setPickedCardId(null);
    }
  }, []);

  const { field, resetField, isHandLocked, isFieldAnimating, showcasePending } =
    useKingAndSpyDuelField(
    duelPublic,
    mySeat,
    isOnlinePlay ? myCommittedCard : null,
    finishShowcase
  );

  const holdingReveal = showcasePending || isFieldAnimating;
  const [shownView, setShownView] = useState<KingAndSpyViewState | null>(null);
  if (!holdingReveal && activeView && shownView !== activeView) {
    setShownView(activeView);
  }
  const displayView = holdingReveal && shownView ? shownView : activeView;
  const showPin =
    pin !== null &&
    activeView !== null &&
    pin.seat === activeView.mySeat &&
    !holdingReveal &&
    (!pinRelease || activeView.myHand.some((card) => card.id === pin.cardId));
  const displayHand = showPin && pin ? pin.cards : (displayView?.myHand ?? []);
  const handLocked = isHandLocked || pin !== null;

  const effectivePickedCardId = handLocked ? null : pickedCardId;

  useLayoutEffect(() => {
    viewRef.current = activeView;
    publicRef.current = publicState;
    secretsRef.current = secrets;
    isOnlineRef.current = isOnlinePlay;
    localPhaseRef.current = localPhase;
    onlineMoveRef.current = online.handleMove;
    revealGenerationRef.current = revealGeneration;
  }, [
    activeView,
    publicState,
    secrets,
    isOnlinePlay,
    localPhase,
    online.handleMove,
    revealGeneration,
  ]);

  const acknowledgeHand = useCallback((seat: 0 | 1) => {
    revealBusy.current = false;
    if (isOnlineRef.current) {
      const view = viewRef.current;
      if (!view || view.phase === "game-over") return;
      if (view.showcase || view.handReady?.[seat] || !view.committedReady[seat]) {
        return;
      }
      if (ackFlight.current) return;
      const sent = onlineMoveRef.current({ type: "king-and-spy-hand-ready" });
      if (!sent) return;
      ackFlight.current = true;
      void Promise.resolve(sent)
        .catch(() => {})
        .finally(() => {
          ackFlight.current = false;
        });
      return;
    }
    if (localPhaseRef.current !== "playing") return;
    const pub = structuredClone(publicRef.current);
    const sec = structuredClone(secretsRef.current);
    if (pub.showcase || pub.handReady?.[seat] || !pub.committedReady[seat]) return;
    const result = applyKingAndSpyHandReady(pub, sec, seat);
    if (result.error) return;
    publicRef.current = pub;
    secretsRef.current = sec;
    setPublicState(pub);
    setSecrets(sec);
    if (pub.phase === "game-over") setLocalPhase("game-over");
    const other: 0 | 1 = seat === 0 ? 1 : 0;
    if (!pub.showcase && !pub.committedReady[other]) {
      setLocalActiveSeat(other);
      setPickedCardId(null);
    }
  }, []);

  const stopHandReveal = useCallback(() => {
    revealBusy.current = false;
    setRevealGeneration((generation) => generation + 1);
    setPin(null);
    setPinRelease(false);
  }, []);

  const beginHandReveal = useCallback(
    (seat: 0 | 1, card: KingAndSpyCard, cards: KingAndSpyCard[]) => {
      const generation = revealGenerationRef.current;
      revealBusy.current = true;
      setPin({ seat, cards, cardId: card.id, gen: generation });
      setPinRelease(false);
      window.setTimeout(() => {
        if (!aliveRef.current || revealGenerationRef.current !== generation) return;
        setPinRelease(true);
        const started = Date.now();
        const waitForDrop = () => {
          if (!aliveRef.current || revealGenerationRef.current !== generation) return;
          const view = viewRef.current;
          const stillThere = Boolean(
            view &&
              view.mySeat === seat &&
              view.myHand.some((held) => held.id === card.id)
          );
          if (stillThere && Date.now() - started < 8000) {
            window.setTimeout(waitForDrop, 80);
            return;
          }
          setPin(null);
          setPinRelease(false);
          const live = viewRef.current;
          const both = Boolean(
            live?.committedReady[0] && live?.committedReady[1]
          );
          window.setTimeout(() => {
            if (!aliveRef.current || revealGenerationRef.current !== generation) {
              return;
            }
            acknowledgeHand(seat);
          }, both ? BOTH_VISIBLE_MS : SOLO_HAND_MS);
        };
        waitForDrop();
      }, HAND_REMOVE_MS);
    },
    [acknowledgeHand]
  );

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!isOnlinePlay) return;
    const id = window.setInterval(() => {
      if (revealBusy.current || ackFlight.current) return;
      const view = viewRef.current;
      if (!view || view.phase === "game-over" || view.showcase) return;
      const seat = view.mySeat;
      if (view.handReady?.[seat] || !view.committedReady[seat]) return;
      const sent = onlineMoveRef.current({ type: "king-and-spy-hand-ready" });
      if (!sent) return;
      ackFlight.current = true;
      void Promise.resolve(sent)
        .catch(() => {})
        .finally(() => {
          ackFlight.current = false;
        });
    }, 700);
    return () => window.clearInterval(id);
  }, [isOnlinePlay]);

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
      setLocalActiveSeat(kingRoleSeat);
      setPickedCardId(null);
      setMyCommittedCard(null);
      setRevealGeneration((generation) => generation + 1);
      setPin(null);
      setPinRelease(false);
      resetField();
      setLocalPhase("playing");
    },
    [recordLocalPlay, hostStartsAsKingLocal, resetField]
  );

  const resetLocal = useCallback(() => {
    setLocalPhase("setup");
    setPickedCardId(null);
    setMyCommittedCard(null);
    setRevealGeneration((generation) => generation + 1);
    setPin(null);
    setPinRelease(false);
    resetField();
  }, [resetField]);

  const commitLocal = useCallback(
    (seat: 0 | 1, card: KingAndSpyCard, handBefore: KingAndSpyCard[]) => {
      const pub = structuredClone(publicState);
      const sec = structuredClone(secrets);
      const result = applyKingAndSpyCommit(pub, sec, seat, card.id, {
        deferResolve: true,
      });
      if (result.error) return;
      publicRef.current = pub;
      secretsRef.current = sec;
      setPublicState(pub);
      setSecrets(sec);
      setPickedCardId(null);
      beginHandReveal(seat, card, handBefore);
    },
    [publicState, secrets, beginHandReveal]
  );

  const handleCommit = useCallback(() => {
    if (!pickedCardId || !activeView || handLocked) return;
    const card = activeView.myHand.find((c) => c.id === pickedCardId);
    if (!card) return;
    const handBefore = activeView.myHand.map((held) => ({ ...held }));

    if (isOnlinePlay && online.mySeat >= 0) {
      if (activeView.committedReady[online.mySeat]) return;
      const seat = online.mySeat === 1 ? 1 : 0;
      setMyCommittedCard(card);
      beginHandReveal(seat, card, handBefore);
      const sent = online.handleMove({
        type: "king-and-spy-commit",
        cardId: pickedCardId,
      });
      setPickedCardId(null);
      if (!sent) {
        stopHandReveal();
        setMyCommittedCard(null);
        return;
      }
      void Promise.resolve(sent).catch(() => {
        stopHandReveal();
        setMyCommittedCard(null);
      });
      return;
    }
    if (localPhase !== "playing") return;
    commitLocal(localActiveSeat, card, handBefore);
  }, [
    pickedCardId,
    activeView,
    isOnlinePlay,
    online,
    localPhase,
    localActiveSeat,
    commitLocal,
    handLocked,
    beginHandReveal,
    stopHandReveal,
  ]);

  const isSetupScreen =
    (mode === "local" &&
      localPhase === "setup" &&
      online.phase === "idle") ||
    (mode === "online" && online.phase === "idle");
  usePlaySetupNavigation(isSetupScreen, resetLocal);

  if (online.completingPendingJoin) {
    return <PendingJoinConnecting />;
  }

  if (mode === "online" && online.phase === "idle" && onlineEnabled) {
    return (
      <OnlineSetupPanel
        title="キング＆スパイ"
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
            <p className="text-center text-xs text-slate-400">ホストの開始側</p>
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
        title="キング＆スパイ"
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

  if (
    mode === "local" &&
    localPhase === "setup" &&
    online.phase === "idle"
  ) {
    return (
      <OnlineSetupPanel
        title="キング＆スパイ"
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
            <p className="text-center text-xs text-slate-400">プレイヤー1の開始側</p>
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

  const matchEnded =
    (isOnlinePlay && online.phase === "finished") ||
    localPhase === "game-over" ||
    activeView.phase === "game-over";
  const finalRevealPlaying = matchEnded && (showcasePending || isFieldAnimating);
  const isGameOver = matchEnded && !finalRevealPlaying;

  const alreadyCommitted = activeView.committedReady[mySeat];

  const scoreView = displayView ?? activeView;
  const pub = toPublicState(scoreView);
  const scores = isGameOver ? toPublicState(activeView).scores : pub.scores;
  const isDrawEnd = isGameOver && Boolean(activeView.draw);
  const winnerSeats =
    isGameOver && activeView.winner !== null ? [activeView.winner] : null;

  let stats: string;
  let action: string;
  let notice: string | undefined;

  if (isGameOver) {
    stats = `最終得点 ${scores[0]} – ${scores[1]}`;
    action = isDrawEnd ? "12ラウンド終了・同点" : "マッチ終了";
    notice = undefined;
  } else {
    stats = `${playerRoleLabel(scoreView.myRole)}側 · 交代まであと${decisivesUntilRoleSwap(scoreView.decisiveCount)}決着`;
    action = "手札から1枚選び、確定する";
    if (isFieldAnimating || showcasePending || finalRevealPlaying) {
      action = "公開中";
    } else if (
      activeView.committedReady[0] &&
      activeView.committedReady[1]
    ) {
      action = "両者のカードが揃いました";
    } else if (alreadyCommitted || myCommittedCard || pin) {
      action = "相手の確定を待っています";
    }
  }

  const replayProps = getOnlineResultReplayProps(
    isOnlinePlay,
    online.isHost,
    () => online.handleRematch({ gameOptions: { hostStartsAsKing } }),
    resetLocal
  );

  const rematchSidePicker =
    isOnlinePlay && online.isHost ? (
      <div className="space-y-2">
        <p className="text-center text-xs text-slate-400">
          再戦時のホストの側
        </p>
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
      </div>
    ) : undefined;

  return (
    <div className="mx-auto w-full max-w-lg space-y-2 sm:space-y-4">
      <TurnBanner
        playerIndex={mySeat}
        playerLabel={
          isOnlinePlay
            ? getSeatDisplayName(online.players, mySeat)
            : `プレイヤー${localActiveSeat + 1}`
        }
        showTurnPhrase={!isOnlinePlay}
        compact
        stats={stats}
        action={action}
        notice={notice}
      />

      {isGameOver && isDrawEnd && (
        <ResultPanel
          draw
          winners={[]}
          winnersLabel="同点のため引き分け"
          {...replayProps}
          replayExtra={rematchSidePicker}
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
          replayExtra={rematchSidePicker}
        />
      )}

      <KingAndSpyDuelField
        field={field}
        labels={seatLabels}
        mySeat={mySeat}
        lastReveal={activeView.lastReveal}
        roundHistory={toPublicState(activeView).roundHistory}
      />

      {!isGameOver && (
        <div className="space-y-2">
          {isOnlinePlay ? (
            <p className="text-center text-xs text-slate-400">あなたの手札</p>
          ) : null}
          <div
            className={`flex flex-wrap justify-center gap-2 sm:gap-3 ${handLocked ? "pointer-events-none opacity-50" : ""}`}
          >
            {displayHand.map((card) => (
              <KingAndSpyPlayingCard
                key={card.id}
                card={card}
                faceDown={false}
                flipped={true}
                size="hand"
                selected={effectivePickedCardId === card.id}
                disabled={alreadyCommitted || handLocked}
                onClick={
                  alreadyCommitted || handLocked
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
                !effectivePickedCardId || alreadyCommitted || handLocked
              }
              onClick={handleCommit}
              className="rounded-lg bg-indigo-600 px-6 py-2 text-sm font-semibold text-white disabled:opacity-40"
            >
              確定
            </button>
          </div>
        </div>
      )}

      <KingAndSpyMatchPanel
        className="mt-1 sm:mt-0"
        state={pub}
        seatLabels={seatLabels}
        mySeat={isOnlinePlay ? mySeat : scoreView.mySeat}
      />
    </div>
  );
}
