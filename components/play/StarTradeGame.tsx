"use client";

import { usePlayPage } from "@/components/play/PlayPageContext";
import { usePlaySetupNavigation } from "@/components/play/usePlaySetupNavigation";
import { useCallback, useMemo, useState } from "react";
import { HandoffGate } from "@/components/play/shared/HandoffGate";
import { ResultPanel } from "@/components/play/shared/ResultPanel";
import { SetupPanel } from "@/components/play/shared/SetupPanel";
import { TurnBanner } from "@/components/play/shared/TurnBanner";
import { winnerIndices } from "@/lib/game-engine";
import { dealStarTradeRound, scoreStarTradeCards } from "@/lib/play/star-trade";
import { getPlayerTurnStyle } from "@/lib/player-colors";

type Card = import("@/lib/play/star-trade").StarTradeCard;

type Phase = "setup" | "handoff" | "playing" | "round-end" | "game-over";
type TurnStep = "draw" | "play";

const SUIT_LABEL: Record<Card["suit"], string> = {
  star: "星",
  moon: "月",
  sun: "太陽",
  comet: "彗星",
};
const SUIT_COLOR: Record<Card["suit"], string> = {
  star: "text-yellow-300",
  moon: "text-slate-200",
  sun: "text-orange-400",
  comet: "text-cyan-400",
};

export function StarTradeGame() {
  const { recordLocalPlay } = usePlayPage();
  const [playerCount, setPlayerCount] = useState(2);
  const [phase, setPhase] = useState<Phase>("setup");
  const [turnStep, setTurnStep] = useState<TurnStep>("draw");
  const [round, setRound] = useState(1);
  const [currentPlayer, setCurrentPlayer] = useState(0);
  const [deck, setDeck] = useState<Card[]>([]);
  const [hands, setHands] = useState<Card[][]>([]);
  const [markets, setMarkets] = useState<Card[][]>([]);
  const [scores, setScores] = useState<number[]>([]);
  const [lastRoundScores, setLastRoundScores] = useState<number[]>([]);

  const beginRound = useCallback(
    (nextRound: number, count: number, prevScores: number[]) => {
      const dealt = dealStarTradeRound(count);
      setDeck(dealt.deck);
      setHands(dealt.hands);
      setMarkets(dealt.markets);
      setScores(prevScores);
      setRound(nextRound);
      setCurrentPlayer(0);
      setTurnStep("draw");
      setPhase("handoff");
    },
    []
  );

  const startGame = useCallback(() => {
    recordLocalPlay();
    beginRound(1, playerCount, Array(playerCount).fill(0));
  }, [recordLocalPlay, beginRound, playerCount]);

  const finishRound = useCallback(
    (nextHands: Card[][], nextMarkets: Card[][]) => {
      const roundScores = nextHands.map((hand, i) =>
        scoreStarTradeCards([...hand, ...nextMarkets[i]]).total
      );
      const nextScores = scores.map((s, i) => s + roundScores[i]);
      setScores(nextScores);
      setLastRoundScores(roundScores);
      setHands(nextHands);
      setMarkets(nextMarkets);
      if (round >= 3) {
        setPhase("game-over");
      } else {
        setPhase("round-end");
      }
    },
    [round, scores]
  );

  const nextRound = useCallback(() => {
    beginRound(round + 1, playerCount, scores);
  }, [beginRound, playerCount, round, scores]);

  const drawCard = useCallback(() => {
    if (phase !== "playing" || turnStep !== "draw") return;
    if (deck.length === 0) {
      finishRound(hands, markets);
      return;
    }
    const card = deck[deck.length - 1];
    setDeck(deck.slice(0, -1));
    setHands(hands.map((h, i) => (i === currentPlayer ? [...h, card] : h)));
    setTurnStep("play");
  }, [phase, turnStep, deck, hands, markets, currentPlayer, finishRound]);

  const playToMarket = useCallback(
    (cardId: string) => {
      if (phase !== "playing" || turnStep !== "play") return;
      const hand = hands[currentPlayer];
      const card = hand.find((c) => c.id === cardId);
      if (!card) return;
      if (markets[currentPlayer].length >= 3) return;

      const newHands = hands.map((h, i) =>
        i === currentPlayer ? h.filter((c) => c.id !== cardId) : h
      );
      const newMarkets = markets.map((m, i) =>
        i === currentPlayer ? [...m, card] : m
      );
      setHands(newHands);
      setMarkets(newMarkets);

      if (newMarkets.every((m) => m.length >= 3)) {
        finishRound(newHands, newMarkets);
        return;
      }

      setCurrentPlayer((currentPlayer + 1) % playerCount);
      setTurnStep("draw");
      setPhase("handoff");
    },
    [phase, turnStep, hands, markets, currentPlayer, playerCount, finishRound]
  );

  const winner = useMemo(() => {
    if (phase !== "game-over") return null;
    return winnerIndices(scores);
  }, [phase, scores]);

  const backToSetup = useCallback(() => setPhase("setup"), []);
  usePlaySetupNavigation(phase === "setup", backToSetup);

  if (phase === "setup") {
    return (
      <SetupPanel
        title="スター・トレード"
        description="同じ画面で交代プレイ。手番のあいだは他プレイヤーの手札を見ません。"
        playerCount={playerCount}
        onPlayerCount={setPlayerCount}
        onStart={startGame}
      />
    );
  }

  if (phase === "handoff") {
    return (
      <HandoffGate
        eyebrow={`ラウンド ${round} / 3 · 山札 ${deck.length} 枚`}
        title={`プレイヤー ${currentPlayer + 1} の番です`}
        description="端末を渡したら、手札を見る準備ができてから開始してください。"
        onContinue={() => setPhase("playing")}
      />
    );
  }

  const isGameOver = phase === "game-over" && winner !== null;

  if (phase === "round-end") {
    return (
      <div className="rounded-2xl border border-surface-border bg-surface-raised p-6 text-center sm:p-8">
        <h2 className="text-xl font-semibold">ラウンド {round} 終了</h2>
        <ul className="mt-4 space-y-1 text-slate-300">
          {scores.map((s, i) => (
            <li key={i}>
              プレイヤー {i + 1}: このラウンド {lastRoundScores[i] ?? 0} 点 · 累計 {s} 点
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={nextRound}
          className="btn-game mt-8"
        >
          ラウンド {round + 1} を開始
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {isGameOver && winner && (
        <ResultPanel
          variant="inline"
          winners={winner}
          onReplay={() => setPhase("setup")}
          details={
            <ul className="space-y-1 text-slate-400">
              {scores.map((s, i) => (
                <li key={i}>
                  プレイヤー {i + 1}: {s} 点
                </li>
              ))}
            </ul>
          }
        />
      )}

      {!isGameOver && (
      <TurnBanner
        playerIndex={currentPlayer}
        playerLabel={`プレイヤー ${currentPlayer + 1}`}
        stats={`ラウンド ${round} / 3 · 山札 ${deck.length} 枚`}
        action={turnStep === "draw" ? "山札から引く" : "手札を1枚出す"}
      />
      )}

      {hands.map((hand, playerIndex) => {
        const isCurrent = currentPlayer === playerIndex;
        const playerStyle = getPlayerTurnStyle(playerIndex);
        const preview = scoreStarTradeCards([...hand, ...markets[playerIndex]]);
        return (
          <section
            key={playerIndex}
            className={`rounded-2xl border p-4 transition ${
              isCurrent
                ? `${playerStyle.sectionBorder} ${playerStyle.sectionBg} ring-1 ${playerStyle.sectionRing}`
                : "border-surface-border bg-surface-raised"
            }`}
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className={`font-semibold ${isCurrent ? playerStyle.label : ""}`}>
                プレイヤー {playerIndex + 1}
              </h3>
              <span className="text-sm text-slate-500">
                累計 {scores[playerIndex]} 点
                {isCurrent ? ` · 見込み ${preview.total} 点` : ""}
              </span>
            </div>

            <p className="mb-2 text-xs text-slate-500">公開エリア（最大3枚）</p>
            <div className="mb-4 flex min-h-[5.5rem] flex-wrap gap-2">
              {markets[playerIndex].map((card) => (
                <CardView key={card.id} card={card} />
              ))}
              {markets[playerIndex].length === 0 && (
                <span className="self-center text-sm text-slate-600">（空）</span>
              )}
            </div>

            <p className="mb-2 text-xs text-slate-500">手札</p>
            <div className="flex flex-wrap gap-2">
              {isCurrent
                ? hand.map((card) => (
                    <button
                      key={card.id}
                      type="button"
                      disabled={isGameOver || turnStep !== "play" || markets[playerIndex].length >= 3}
                      onClick={() => playToMarket(card.id)}
                      className="disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <CardView card={card} interactive={turnStep === "play"} />
                    </button>
                  ))
                : hand.map((card) => (
                    <CardView key={card.id} card={card} faceDown />
                  ))}
            </div>

            {isCurrent && (
              <button
                type="button"
                onClick={drawCard}
                disabled={isGameOver || turnStep !== "draw"}
                className="mt-4 min-h-11 rounded-lg border border-accent/50 px-4 py-2 text-sm text-accent transition hover:bg-accent/10 disabled:cursor-not-allowed disabled:opacity-40"
              >
                山札から1枚引く
              </button>
            )}
          </section>
        );
      })}

    </div>
  );
}

function CardView({
  card,
  interactive,
  faceDown,
}: {
  card: Card;
  interactive?: boolean;
  faceDown?: boolean;
}) {
  if (faceDown) {
    return (
      <div
        className="flex h-[4.5rem] w-12 flex-col items-center justify-center rounded-lg border border-surface-border bg-surface-border/60 text-sm shadow-sm sm:h-20 sm:w-14"
        aria-label="伏せた手札"
      >
        <span className="text-xs text-slate-500">裏</span>
      </div>
    );
  }

  return (
    <div
      className={`flex h-[4.5rem] w-12 flex-col items-center justify-center rounded-lg border border-surface-border bg-surface text-sm shadow-sm sm:h-20 sm:w-14 ${
        interactive ? "cursor-pointer hover:border-accent hover:shadow-md" : ""
      }`}
    >
      <span className={`text-xs font-medium ${SUIT_COLOR[card.suit]}`}>
        {SUIT_LABEL[card.suit]}
      </span>
      <span className="text-lg font-bold">{card.value}</span>
    </div>
  );
}
