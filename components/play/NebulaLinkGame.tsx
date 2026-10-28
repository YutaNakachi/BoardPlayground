"use client";

import { usePlayPage } from "@/components/play/PlayPageContext";
import { usePlaySetupNavigation } from "@/components/play/usePlaySetupNavigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { NebulaPiecePreview } from "@/components/play/shared/NebulaPiecePreview";
import { OnlineFirstPlayerPicker } from "@/components/play/shared/OnlineFirstPlayerPicker";
import { OnlinePlayerCountPicker } from "@/components/play/shared/OnlinePlayerCountPicker";
import { OnlineSetupPanel } from "@/components/play/shared/OnlineSetupPanel";
import { PendingJoinConnecting } from "@/components/play/shared/PendingJoinConnecting";
import { ResultPanel } from "@/components/play/shared/ResultPanel";
import { TurnBanner } from "@/components/play/shared/TurnBanner";
import { usePlayStats } from "@/components/PlayStatsProvider";
import { useOnlineFirstPlayer } from "@/hooks/useOnlineFirstPlayer";
import { useOnlineRoom } from "@/hooks/useOnlineRoom";
import type { PlayerCountOption } from "@/lib/online/game-options";
import type { NebulaOnlineState } from "@/lib/online/moves";
import { getOnlineResultReplayProps } from "@/lib/online/result-replay";
import {
  formatSeatLabel,
  formatWinnersWithNames,
} from "@/lib/online/player-labels";
import type { PlayMode } from "@/lib/online/types";
import { getPlayerTurnStyle, playerPieceClasses } from "@/lib/player-colors";
import {
  applyNebulaPass,
  applyNebulaPlace,
  applyNebulaSpinRoulette,
  canNebulaPass,
  homeEdgeLabel,
  homeEdgeOwnersAt,
  initialNebulaLink,
  isLegalNebulaPlacement,
  legalNebulaPlacements,
  NEBULA_CORE,
  NEBULA_MONO_ID,
  NEBULA_SIZE,
  nebulaIndex,
  nebulaRowCol,
  nebulaWinners,
  pieceCellsAt,
  pieceLabel,
  playerHomeEdge,
  type NebulaEdge,
  type NebulaPlacement,
  type NebulaState,
  borderEdgesAt,
} from "@/lib/play/nebula-link";

type Phase = "setup" | "playing" | "game-over";

/** タッチ時は指の少し上・左をアンカーにする（指で隠れない） */
const TOUCH_PLACEMENT_OFFSET_Y = 56;
const TOUCH_PLACEMENT_OFFSET_X = 28;

function cellIndexFromClient(
  grid: HTMLDivElement,
  clientX: number,
  clientY: number,
  pointerType: string
): number | null {
  const rect = grid.getBoundingClientRect();
  const offsetY = pointerType === "touch" ? TOUCH_PLACEMENT_OFFSET_Y : 0;
  const offsetX = pointerType === "touch" ? TOUCH_PLACEMENT_OFFSET_X : 0;
  const x = clientX - rect.left - offsetX;
  const y = clientY - rect.top - offsetY;
  if (x < 0 || y < 0 || x >= rect.width || y >= rect.height) return null;
  const col = Math.min(NEBULA_SIZE - 1, Math.floor((x / rect.width) * NEBULA_SIZE));
  const row = Math.min(NEBULA_SIZE - 1, Math.floor((y / rect.height) * NEBULA_SIZE));
  return nebulaIndex(row, col);
}

const NEUTRAL_EDGE_FILL = "rgba(71,85,105,0.55)";

function edgeFillAt(
  row: number,
  col: number,
  playerCount: number
): Partial<Record<NebulaEdge, string>> {
  const edges = borderEdgesAt(row, col);
  const owners = homeEdgeOwnersAt(nebulaIndex(row, col), playerCount);
  const fills: Partial<Record<NebulaEdge, string>> = {};
  edges.forEach((edge, i) => {
    const owner = owners[i];
    fills[edge] =
      owner === "neutral"
        ? NEUTRAL_EDGE_FILL
        : getPlayerTurnStyle(owner).fill;
  });
  return fills;
}

type HomeEdgeLook = {
  className: string;
  style?: CSSProperties;
};

function fillAlpha(color: string, alpha = 0.62): string {
  if (color.startsWith("rgba")) return color;
  const hex = color.replace("#", "");
  const r = Number.parseInt(hex.slice(0, 2), 16);
  const g = Number.parseInt(hex.slice(2, 4), 16);
  const b = Number.parseInt(hex.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** 角マス：マス対角で2色を斜め分割（左辺側 / 上辺側など辺の色を対応する三角に） */
function cornerDiagonalStyle(
  row: number,
  col: number,
  fills: Partial<Record<NebulaEdge, string>>
): CSSProperties | null {
  const last = NEBULA_SIZE - 1;
  const n = fills.north;
  const s = fills.south;
  const e = fills.east;
  const w = fills.west;

  if (row === 0 && col === 0 && n && w) {
    return {
      background: `linear-gradient(to top right, ${fillAlpha(w)} 50%, ${fillAlpha(n)} 50%)`,
    };
  }
  if (row === 0 && col === last && n && e) {
    return {
      background: `linear-gradient(to top left, ${fillAlpha(e)} 50%, ${fillAlpha(n)} 50%)`,
    };
  }
  if (row === last && col === 0 && s && w) {
    return {
      background: `linear-gradient(to bottom right, ${fillAlpha(w)} 50%, ${fillAlpha(s)} 50%)`,
    };
  }
  if (row === last && col === last && s && e) {
    return {
      background: `linear-gradient(to bottom left, ${fillAlpha(e)} 50%, ${fillAlpha(s)} 50%)`,
    };
  }
  return null;
}

function nebulaHomeEdgeCellLook(
  row: number,
  col: number,
  playerCount: number
): HomeEdgeLook {
  const ring = "ring-1 ring-inset";
  const owners = homeEdgeOwnersAt(nebulaIndex(row, col), playerCount);
  if (owners.length === 0) return { className: "" };

  if (owners.length === 1) {
    const only = owners[0];
    if (only === "neutral") {
      return { className: `${ring} bg-slate-600/40 ring-slate-500/70` };
    }
    const s = getPlayerTurnStyle(only);
    return {
      className: `${ring} ${s.pieceRing}`,
      style: { backgroundColor: `${s.fill}73` },
    };
  }

  const fills = edgeFillAt(row, col, playerCount);
  const cornerStyle = cornerDiagonalStyle(row, col, fills);
  if (cornerStyle) {
    return {
      className: `${ring} ring-white/25`,
      style: cornerStyle,
    };
  }

  return { className: `${ring} bg-slate-600/40 ring-slate-500/70` };
}

export function NebulaLinkGame() {
  const { recordLocalPlay, setPlayMode } = usePlayPage();
  const { onlineEnabled } = usePlayStats();
  const online = useOnlineRoom("nebula-link");
  const { firstPlayer, onFirstPlayerChange, seatCount } =
    useOnlineFirstPlayer(online);
  const [mode, setMode] = useState<PlayMode>("local");
  const [onlinePlayerCount, setOnlinePlayerCount] =
    useState<PlayerCountOption>(2);
  const [playerCount, setPlayerCount] = useState(2);
  const [localPhase, setLocalPhase] = useState<Phase>("setup");
  const [localGame, setLocalGame] = useState<NebulaState | null>(null);

  const isOnlinePlay =
    online.phase === "playing" || online.phase === "finished";
  const onlineState = online.gameState as NebulaOnlineState | null;
  const isOnline = isOnlinePlay;
  const canAct = !isOnline || online.isMyTurn;
  const game: NebulaState | null =
    isOnline && onlineState ? onlineState : localGame;
  const phase: Phase =
    isOnline && onlineState
      ? onlineState.phase === "game-over" || online.phase === "finished"
        ? "game-over"
        : "playing"
      : localPhase;

  useEffect(() => {
    if (
      online.room?.code &&
      (online.phase === "waiting" || online.phase === "playing")
    ) {
      setPlayMode({ mode: "online", roomCode: online.room.code });
    }
  }, [online.room?.code, online.phase, setPlayMode]);

  const [notice, setNotice] = useState<string | null>(null);
  const [selectedPieceId, setSelectedPieceId] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [placingPointer, setPlacingPointer] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);

  const startGame = useCallback(() => {
    recordLocalPlay();
    setLocalGame(initialNebulaLink(playerCount));
    setNotice(null);
    setSelectedPieceId(null);
    setRotation(0);
    setSpinning(false);
    setHoverIndex(null);
    setLocalPhase("playing");
  }, [recordLocalPlay, playerCount]);

  const allowedPieces = useMemo(() => {
    if (!game) return [NEBULA_MONO_ID];
    return game.roulette.length > 0
      ? [...game.roulette, NEBULA_MONO_ID]
      : [NEBULA_MONO_ID];
  }, [game]);

  const legalMoves = useMemo(() => {
    if (!game || phase !== "playing") return [];
    return legalNebulaPlacements(
      game.board,
      game.currentPlayer,
      game.playerCount,
      allowedPieces
    );
  }, [game, phase, allowedPieces]);

  const previewCells = useMemo(() => {
    if (!game || !canAct || !selectedPieceId || hoverIndex === null) {
      return new Set<number>();
    }
    const { row, col } = nebulaRowCol(hoverIndex);
    const cells = pieceCellsAt(selectedPieceId, rotation, row, col);
    const set = new Set<number>();
    for (const { row: r, col: c } of cells) {
      if (r >= 0 && r < NEBULA_SIZE && c >= 0 && c < NEBULA_SIZE) {
        set.add(nebulaIndex(r, c));
      }
    }
    return set;
  }, [game, canAct, selectedPieceId, rotation, hoverIndex]);

  const spinRoulette = useCallback(() => {
    if (!game || spinning || game.roulette.length > 0) return;
    if (isOnline) {
      if (!online.isMyTurn || online.movePending) return;
      void online.handleMove({ type: "nebula-spin" });
      return;
    }
    setSpinning(true);
    setNotice(null);
    window.setTimeout(() => {
      const next = applyNebulaSpinRoulette(game);
      if (next) {
        setLocalGame(next);
        setSelectedPieceId(null);
        setRotation(0);
      }
      setSpinning(false);
    }, 600);
  }, [game, spinning, isOnline, online]);

  const placeAt = useCallback(
    (index: number) => {
      if (!game || phase !== "playing" || !selectedPieceId) return false;
      const { row, col } = nebulaRowCol(index);
      const placement: NebulaPlacement = {
        pieceId: selectedPieceId,
        rotation,
        anchorRow: row,
        anchorCol: col,
      };
      if (isOnline) {
        if (!online.isMyTurn || online.movePending) return false;
        void online.handleMove({
          type: "nebula-place",
          pieceId: selectedPieceId,
          rotation,
          anchorRow: row,
          anchorCol: col,
        });
        setSelectedPieceId(null);
        setRotation(0);
        setHoverIndex(null);
        return true;
      }
      const next = applyNebulaPlace(game, placement);
      if (!next) {
        setNotice("ここには置けません。");
        return false;
      }
      setNotice(null);
      setSelectedPieceId(null);
      setRotation(0);
      setHoverIndex(null);
      setLocalGame(next);
      if (next.gameOver) setLocalPhase("game-over");
      return true;
    },
    [phase, game, selectedPieceId, rotation, isOnline, online]
  );

  const pass = useCallback(() => {
    if (!game || phase !== "playing") return;
    if (isOnline) {
      if (!online.isMyTurn || online.movePending) return;
      void online.handleMove({ type: "nebula-pass" });
      return;
    }
    const next = applyNebulaPass(game);
    if (!next) return;
    setNotice(`プレイヤー ${game.currentPlayer + 1} がパスしました。`);
    setSelectedPieceId(null);
    setRotation(0);
    setHoverIndex(null);
    setSpinning(false);
    setLocalGame(next);
    if (next.gameOver) setLocalPhase("game-over");
  }, [phase, game, isOnline, online]);

  const winner = useMemo(() => {
    if (phase !== "game-over" || !game) return null;
    return nebulaWinners(game);
  }, [phase, game]);

  const reset = useCallback(() => {
    online.reset();
    setLocalPhase("setup");
    setMode("local");
    setPlayMode({ mode: "local" });
  }, [online, setPlayMode]);

  const isSetupScreen =
    (localPhase === "setup" && online.phase === "idle") ||
    online.phase === "waiting";
  usePlaySetupNavigation(isSetupScreen, reset);

  const setupHint = (
    <p className="text-xs text-slate-500">
      2人は北・南、3人は北・東・西（南は中立）、4人は四辺。初手はホーム辺から、2手目以降は自分のブロックに角だけでつなぎます。
    </p>
  );

  if (online.completingPendingJoin) {
    return <PendingJoinConnecting />;
  }

  if (localPhase === "setup" && online.phase === "idle") {
    return (
      <OnlineSetupPanel
        title="ネビュラ・リンク"
        description="21×21の盤面で、様々な形状のブロックを配置し、星核を自分のホーム辺側に閉じ込めたら勝ち。"
        mode={mode}
        onModeChange={setMode}
        onlineSupported={onlineEnabled}
        onCreateRoom={(displayName) =>
          online.handleCreate(displayName, {
            playerCount: onlinePlayerCount,
            firstPlayer,
          })
        }
        onJoinRoom={online.handleJoin}
        onStartLocal={() => {
          setMode("local");
          startGame();
        }}
        loading={online.loading}
        error={online.error}
        initialJoinCode={online.joinCodeFromUrl}
        createExtra={
          <OnlinePlayerCountPicker
            value={onlinePlayerCount}
            options={[2, 3, 4]}
            onChange={setOnlinePlayerCount}
          />
        }
        extra={
          <>
            <OnlinePlayerCountPicker
              value={playerCount as PlayerCountOption}
              options={[2, 3, 4]}
              onChange={setPlayerCount}
            />
            {setupHint}
          </>
        }
      />
    );
  }

  if (online.phase === "waiting" && online.room) {
    return (
      <OnlineSetupPanel
        title="ネビュラ・リンク"
        description="21×21の盤面で、様々な形状のブロックを配置し、星核を自分のホーム辺側に閉じ込めたら勝ち。"
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
          maxPlayers: online.maxPlayers,
          isHost: online.isHost,
          onStart: () => online.handleStart({ firstPlayer }),
          canStart: online.canStart,
          extra: (
            <>
              {setupHint}
              <OnlineFirstPlayerPicker
                players={online.players}
                value={firstPlayer}
                seatCount={seatCount}
                onChange={online.isHost ? onFirstPlayerChange : undefined}
                readOnly={!online.isHost}
              />
            </>
          ),
        }}
      />
    );
  }

  if (!game) return null;

  const isGameOver = phase === "game-over" && winner !== null;
  const winnerLabels =
    isOnline && isGameOver && winner
      ? formatWinnersWithNames(online.players, winner)
      : null;
  const replayProps = getOnlineResultReplayProps(
    isOnline,
    online.isHost,
    () => online.handleRematch({ firstPlayer }),
    reset,
    online.rematchLoading
  );
  const activePieceId = canAct ? selectedPieceId : null;
  const activeRotation = canAct ? rotation : 0;
  const activeHoverIndex = canAct ? hoverIndex : null;
  const showRouletteSpinning = isOnline
    ? online.movePending && game.roulette.length === 0
    : spinning;
  const mustPass = phase === "playing" && canAct && canNebulaPass(game);
  const home = playerHomeEdge(game.currentPlayer, game.playerCount);
  const rouletteReady = game.roulette.length === 3;
  const turnStyle = getPlayerTurnStyle(game.currentPlayer);

  const cellPlacementLegal = (index: number) =>
    Boolean(
      activePieceId &&
        isLegalNebulaPlacement(
          game.board,
          game.currentPlayer,
          game.playerCount,
          activePieceId,
          activeRotation,
          nebulaRowCol(index).row,
          nebulaRowCol(index).col
        )
    );

  const piecePickButtonClass = (pieceId: string) =>
    `flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border p-0.5 sm:h-12 sm:w-12 ${
      activePieceId === pieceId
        ? `${turnStyle.sectionBorder} ${turnStyle.sectionBg} ring-2 ${turnStyle.sectionRing}`
        : "border-surface-border bg-surface-raised hover:border-white/20"
    }`;

  const previewRotationFor = (pieceId: string) =>
    activePieceId === pieceId ? activeRotation : 0;

  const pickPiece = (pieceId: string) => {
    if (!canAct) return;
    setNotice(null);
    if (selectedPieceId === pieceId) {
      setRotation((r) => (r + 1) % 4);
    } else {
      setSelectedPieceId(pieceId);
      setRotation(0);
    }
  };

  const placementLegal =
    activeHoverIndex !== null &&
    Boolean(activePieceId && cellPlacementLegal(activeHoverIndex));

  const handleGridPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isGameOver || !canAct || !activePieceId) return;
    const index = cellIndexFromClient(e.currentTarget, e.clientX, e.clientY, e.pointerType);
    if (index === null) return;
    setHoverIndex(index);
    setPlacingPointer(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handleGridPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!canAct || !activePieceId) return;
    const index = cellIndexFromClient(e.currentTarget, e.clientX, e.clientY, e.pointerType);
    if (index !== null) setHoverIndex(index);
  };

  const handleGridPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!canAct || (!placingPointer && !activePieceId)) return;
    const index =
      cellIndexFromClient(e.currentTarget, e.clientX, e.clientY, e.pointerType) ??
      activeHoverIndex;
    if (index !== null && activePieceId && cellPlacementLegal(index)) {
      placeAt(index);
    }
    setPlacingPointer(false);
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  return (
    <div className="space-y-2 sm:space-y-3">
      {isGameOver && game && (
        <ResultPanel
          variant="inline"
          winners={winner ?? []}
          winnersLabel={winnerLabels ?? undefined}
          draw={game.isDraw}
          {...replayProps}
          replayExtra={
            isOnline ? (
              <OnlineFirstPlayerPicker
                players={online.players}
                value={firstPlayer}
                seatCount={seatCount}
                onChange={online.isHost ? onFirstPlayerChange : undefined}
                readOnly={!online.isHost}
              />
            ) : undefined
          }
          details={
            <p className="text-slate-400">
              {game.isDraw
                ? "全員が連続パスし、引き分けになりました。"
                : "星核を自分のホーム辺側に閉じ込めました。"}
            </p>
          }
        />
      )}

      {!isGameOver && (
        <TurnBanner
          playerIndex={game.currentPlayer}
          playerLabel={
            isOnline
              ? formatSeatLabel(online.players, game.currentPlayer)
              : `プレイヤー ${game.currentPlayer + 1}`
          }
          stats={`ホーム辺：${homeEdgeLabel(home)} · 置ける手 ${legalMoves.length}`}
          action={
            isOnline && !online.isMyTurn
              ? "相手の手番です"
              : notice ??
            (mustPass
              ? "置ける形がないためパスできます。"
              : activePieceId
                ? "駒を選び、盤のマスをクリックして置きます（ドラッグでも可）。同じ形をもう一度押すと回転します。"
                : rouletteReady
                  ? "ルーレットの形または単マスを選んでください。"
                  : "ルーレットを回すか、単マスを選んでください。")
          }
        />
      )}

      <div
        ref={gridRef}
        className={`mx-auto grid w-fit max-w-full gap-px sm:gap-0.5 ${
          activePieceId && !isGameOver ? "touch-none select-none" : ""
        }`}
        style={{
          gridTemplateColumns: `repeat(${NEBULA_SIZE}, clamp(0.95rem, 4vmin, 1.3rem))`,
          gridTemplateRows: `repeat(${NEBULA_SIZE}, clamp(0.95rem, 4vmin, 1.3rem))`,
        }}
        onPointerDown={handleGridPointerDown}
        onPointerMove={handleGridPointerMove}
        onPointerUp={handleGridPointerUp}
        onPointerCancel={handleGridPointerUp}
      >
        {game.board.map((owner, index) => {
          const isCore = index === NEBULA_CORE;
          const empty = owner === null;
          const inPreview = previewCells.has(index);

          const { row: cellRow, col: cellCol } = nebulaRowCol(index);
          const edgeLook = nebulaHomeEdgeCellLook(
            cellRow,
            cellCol,
            game.playerCount
          );

          let emptyClass =
            edgeLook.className || "bg-surface-raised/80 ring-1 ring-surface-border/80";
          const emptyStyle = edgeLook.style;
          if (inPreview) {
            emptyClass = placementLegal
              ? `${turnStyle.piece} opacity-90 ring-2 ring-white/80 brightness-110`
              : "bg-slate-500/35 ring-2 ring-slate-400/50";
          }

          return (
            <div
              key={index}
              role="button"
              tabIndex={isCore || isGameOver ? -1 : 0}
              data-cell-index={index}
              style={empty && !inPreview && !isCore ? emptyStyle : undefined}
              className={`size-full rounded-[1px] transition ${
                isCore
                  ? "cursor-default bg-yellow-300/30 ring-1 ring-yellow-300/60"
                  : empty
                    ? emptyClass
                    : playerPieceClasses(owner)
              } flex items-center justify-center`}
              aria-label={isCore ? "星核" : empty ? "空マス" : `プレイヤー ${owner + 1}`}
            >
              {isCore ? "★" : null}
            </div>
          );
        })}
      </div>

      {!isGameOver && canAct && (
        <div className="flex flex-col items-center gap-2">
          <div className="flex max-w-full flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              disabled={rouletteReady || showRouletteSpinning}
              onClick={spinRoulette}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium text-white transition disabled:opacity-40 sm:text-sm sm:px-4 sm:py-2 ${turnStyle.surface} ${turnStyle.surfaceBorder} hover:brightness-110`}
            >
              {showRouletteSpinning
                ? "回しています…"
                : rouletteReady
                  ? "ルーレット済み"
                  : "ルーレット"}
            </button>
            {mustPass ? (
              <button
                type="button"
                disabled={isOnline && (!online.isMyTurn || online.movePending)}
                onClick={pass}
                className="rounded-lg border border-surface-border bg-surface-raised px-3 py-1.5 text-xs font-medium text-white hover:border-white/30 sm:text-sm sm:px-4 sm:py-2"
              >
                パス
              </button>
            ) : null}
            {rouletteReady
              ? game.roulette.map((id) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => pickPiece(id)}
                    className={piecePickButtonClass(id)}
                    aria-label={`${pieceLabel(id)}。選んだ状態でもう一度押すと回転`}
                  >
                    <NebulaPiecePreview
                      pieceId={id}
                      rotation={previewRotationFor(id)}
                      playerIndex={game.currentPlayer}
                    />
                  </button>
                ))
              : null}
            <button
              type="button"
              onClick={() => pickPiece(NEBULA_MONO_ID)}
              className={piecePickButtonClass(NEBULA_MONO_ID)}
              aria-label="単マス（いつでも使えます）。選んだ状態でもう一度押すと回転"
            >
              <NebulaPiecePreview
                pieceId={NEBULA_MONO_ID}
                rotation={previewRotationFor(NEBULA_MONO_ID)}
                playerIndex={game.currentPlayer}
              />
            </button>
          </div>

          <ul className="flex max-w-full flex-wrap justify-center gap-1.5">
            {Array.from({ length: game.playerCount }, (_, player) => {
              const style = getPlayerTurnStyle(player);
              const edge = playerHomeEdge(player, game.playerCount);
              return (
                <li
                  key={player}
                  className={`flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[11px] sm:text-xs ${
                    game.currentPlayer === player
                      ? `${style.sectionBorder} ${style.sectionBg}`
                      : "border-surface-border bg-surface-raised/80"
                  }`}
                >
                  <span className={`inline-block h-2 w-2 shrink-0 rounded-full ${style.dot}`} />
                  <span className="text-slate-200">P{player + 1}</span>
                  <span className={style.surfaceText}>{homeEdgeLabel(edge)}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {isGameOver && (
        <ul className="flex flex-wrap justify-center gap-2">
          {Array.from({ length: game.playerCount }, (_, player) => {
            const style = getPlayerTurnStyle(player);
            const edge = playerHomeEdge(player, game.playerCount);
            return (
              <li
                key={player}
                className="flex items-center gap-2 rounded-lg border border-surface-border bg-surface-raised px-2 py-1 text-xs"
              >
                <span className={`inline-block h-2 w-2 rounded-full ${style.dot}`} />
                P{player + 1} · {homeEdgeLabel(edge)}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
