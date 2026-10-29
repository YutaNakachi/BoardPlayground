"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { usePlayPage } from "@/components/play/PlayPageContext";
import { joinRoomFlow } from "@/lib/online/join-room-flow";
import {
  clearPendingJoin,
  pendingJoinMatchesUrlCode,
  readPendingJoin,
  readLastDisplayName,
  saveLastDisplayName,
  savePendingJoin,
} from "@/lib/online/join-room-pending";
import { mergeGameOptions } from "@/lib/online/game-options";
import { isOnlineRematchLoading } from "@/lib/online/result-replay";
import {
  applyMove,
  dejarikTurnSeat,
  turnSeatForState,
  type DejarikOnlineState,
  type GameState,
  type MovePayload,
} from "@/lib/online/moves";

/** サーバー側乱数の手（楽観更新すると結果が一瞬ずれる） */
function isServerRandomMove(move: MovePayload): boolean {
  return move.type === "nebula-spin" || move.type === "ludo-roll";
}
import { getOrCreatePlayerId } from "@/lib/online/player-id";
import { normalizeRoomCodeInput } from "@/lib/online/room-code";
import {
  createRoom,
  fetchRoom,
  joinRoom,
  sendRoomMove,
  startRoomGame,
  updateRoomGameOptions,
  type StartRoomParams,
} from "@/lib/online/room-client";
import { shouldApplyRemoteGameVersion } from "@/lib/online/sync-game-state";
import { isOnlineSecretGame } from "@/lib/online/secret-games";
import type { OnlineGameSlug, RoomInfo, RoomPlayer } from "@/lib/online/types";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

type OnlinePhase = "idle" | "waiting" | "playing" | "finished";

const EMPTY_PLAYERS: RoomPlayer[] = [];

type RoomStateBroadcast = {
  state: GameState;
  version: number;
  currentPlayer: number | null;
};

export function useOnlineRoom(gameSlug: string) {
  const { registerPlayExit } = usePlayPage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pendingUrlJoinRef = useRef<string | null>(null);
  const [phase, setPhase] = useState<OnlinePhase>("idle");
  const [room, setRoom] = useState<RoomInfo | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [version, setVersion] = useState(0);
  const [currentPlayer, setCurrentPlayer] = useState<number | null>(null);
  const [myPlayerId, setMyPlayerId] = useState("");
  const [mySeat, setMySeat] = useState(-1);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [movePending, setMovePending] = useState(false);
  const [moveError, setMoveError] = useState<string | null>(null);
  const [roomSyncReady, setRoomSyncReady] = useState(true);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const realtimeCleanupRef = useRef<(() => void) | undefined>(undefined);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const versionRef = useRef(0);
  const gameStateRef = useRef<GameState | null>(null);
  const pendingMoveRef = useRef(false);
  const moveQueueRef = useRef<MovePayload[]>([]);
  const roomRef = useRef(room);

  type MoveRollback = {
    state: GameState;
    version: number;
    currentPlayer: number | null;
    phase: OnlinePhase;
  };

  useEffect(() => {
    roomRef.current = room;
  }, [room]);

  const broadcastGameState = useCallback(
    (state: GameState, remoteVersion: number, remoteCurrentPlayer: number | null) => {
      if (
        roomRef.current &&
        isOnlineSecretGame(roomRef.current.gameSlug)
      ) {
        const channel = channelRef.current;
        if (!channel) return;
        void channel.send({
          type: "broadcast",
          event: "room_state",
          payload: { version: remoteVersion, secretTick: true },
        });
        return;
      }
      const channel = channelRef.current;
      if (!channel) return;
      void channel.send({
        type: "broadcast",
        event: "room_state",
        payload: { state, version: remoteVersion, currentPlayer: remoteCurrentPlayer },
      });
    },
    []
  );

  const clearRealtime = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    realtimeCleanupRef.current?.();
    realtimeCleanupRef.current = undefined;
    channelRef.current = null;
    pendingMoveRef.current = false;
    moveQueueRef.current = [];
  }, []);

  const applyRemoteGameState = useCallback(
    (
      state: GameState,
      remoteVersion: number,
      remoteCurrentPlayer: number | null,
      options?: { fromRefresh?: boolean }
    ): boolean => {
      const remoteGameOver = state.phase === "game-over";
      const secretSlug = roomRef.current?.gameSlug;
      const nonSecret =
        !!secretSlug && !isOnlineSecretGame(secretSlug as OnlineGameSlug);
      if (pendingMoveRef.current) {
        const secretInFlight =
          !!secretSlug &&
          isOnlineSecretGame(secretSlug) &&
          remoteVersion > versionRef.current;
        if (remoteVersion > versionRef.current && !remoteGameOver) {
          pendingMoveRef.current = false;
          setMovePending(false);
        } else if (
          nonSecret &&
          options?.fromRefresh &&
          remoteVersion >= versionRef.current &&
          !remoteGameOver
        ) {
          pendingMoveRef.current = false;
          setMovePending(false);
        } else if (!remoteGameOver && !secretInFlight) {
          return false;
        }
        if (remoteGameOver) {
          pendingMoveRef.current = false;
          setMovePending(false);
        }
      }
      const forceFromServer =
        options?.fromRefresh && remoteVersion > versionRef.current;
      if (
        !forceFromServer &&
        !shouldApplyRemoteGameVersion(
          remoteVersion,
          versionRef.current,
          state,
          gameStateRef.current
        )
      ) {
        return false;
      }
      setGameState(state);
      gameStateRef.current = state;
      setVersion(remoteVersion);
      versionRef.current = remoteVersion;
      let resolvedCurrentPlayer = remoteCurrentPlayer;
      if (roomRef.current?.gameSlug === "dejarik") {
        const seat = dejarikTurnSeat(state as DejarikOnlineState);
        if (seat !== null) resolvedCurrentPlayer = seat;
      }
      setCurrentPlayer(resolvedCurrentPlayer);
      if (
        state.phase === "playing" ||
        state.phase === "placement" ||
        state.phase === "selecting"
      ) {
        setPhase("playing");
      } else if (state.phase === "game-over") {
        setPhase("finished");
        setRoom((prev) =>
          prev && prev.status !== "finished"
            ? { ...prev, status: "finished" }
            : prev
        );
      }
      return true;
    },
    []
  );

  const refreshRoom = useCallback(
    async (roomId: string, options?: { playerId?: string }) => {
    const slugForFetch =
      roomRef.current?.gameSlug ??
      (typeof window !== "undefined" ? gameSlug : "");
    const pid =
      options?.playerId ?? (myPlayerId || getOrCreatePlayerId());
    const data = await fetchRoom(
      roomId,
      isOnlineSecretGame(slugForFetch) ? pid : undefined
    );
    setRoom(data.room);
    if (data.gameState) {
      const remoteState = data.gameState.state as GameState;
      const applied = applyRemoteGameState(
        remoteState,
        data.gameState.version,
        data.gameState.currentPlayer,
        { fromRefresh: true }
      );
      if (applied) {
        if (remoteState.phase === "game-over" || data.room.status === "finished") {
          setPhase("finished");
        } else if (data.room.status === "playing") {
          setPhase("playing");
        }
      }
    } else if (data.room.status === "waiting") {
      setPhase("waiting");
    }
    setRoomSyncReady(true);
    return data;
  },
    [applyRemoteGameState, gameSlug, myPlayerId]
  );

  const startPoll = useCallback(
    (roomId: string, options?: { playingFallback?: boolean }) => {
      if (pollRef.current) return;
      const intervalMs = isOnlineSecretGame(gameSlug)
        ? 400
        : options?.playingFallback
          ? 2500
          : 1000;
      pollRef.current = setInterval(() => {
        void refreshRoom(roomId);
      }, intervalMs);
    },
    [refreshRoom, gameSlug]
  );

  const subscribeRealtime = useCallback(
    (roomId: string) => {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) {
        startPoll(roomId);
        return;
      }

      // room_state only: it is the sole table in supabase_realtime publication.
      // Broadcast is the fast path; postgres_changes reconciles after DB replication.
      const applyRow = (row: {
        state: GameState;
        version: number;
        current_player: number | null;
      }) => {
        if (
          roomRef.current &&
          isOnlineSecretGame(roomRef.current.gameSlug)
        ) {
          void refreshRoom(roomId);
          return;
        }
        applyRemoteGameState(row.state, row.version, row.current_player);
      };

      const channel = supabase
        .channel(`room-${roomId}`, {
          config: { broadcast: { ack: false, self: false } },
        })
        .on("broadcast", { event: "room_state" }, ({ payload }) => {
          if (
            roomRef.current &&
            isOnlineSecretGame(roomRef.current.gameSlug)
          ) {
            void refreshRoom(roomId);
            return;
          }
          const row = payload as RoomStateBroadcast;
          applyRemoteGameState(row.state, row.version, row.currentPlayer);
        })
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "room_state",
            filter: `room_id=eq.${roomId}`,
          },
          (payload) => {
            applyRow(
              payload.new as {
                state: GameState;
                version: number;
                current_player: number | null;
              }
            );
          }
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "room_state",
            filter: `room_id=eq.${roomId}`,
          },
          (payload) => {
            applyRow(
              payload.new as {
                state: GameState;
                version: number;
                current_player: number | null;
              }
            );
          }
        )
        .subscribe();

      channelRef.current = channel;

      return () => {
        channelRef.current = null;
        void supabase.removeChannel(channel);
      };
    },
    [applyRemoteGameState, refreshRoom, startPoll]
  );

  useEffect(() => {
    return registerPlayExit(clearRealtime);
  }, [registerPlayExit, clearRealtime]);

  useEffect(() => {
    return clearRealtime;
  }, [clearRealtime]);

  // 待機・終局: room / game_options は Realtime 外のためポーリング（先攻変更の同期など）
  useEffect(() => {
    if (phase !== "waiting" && phase !== "finished") return;
    if (!room?.id || !getSupabaseBrowserClient()) return;
    startPoll(room.id);
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [phase, room?.id, startPoll]);

  // 対局中: Realtime 欠落時のフォールバック（秘密対戦は高頻度、それ以外は低頻度）
  useEffect(() => {
    if (!room?.id) return;
    if (phase !== "playing") return;
    startPoll(room.id, { playingFallback: !isOnlineSecretGame(gameSlug) });
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [phase, room?.id, gameSlug, startPoll]);

  const setupRoom = useCallback(
    (roomId: string, playerId: string, seatIndex: number, roomInfo: RoomInfo) => {
      clearRealtime();
      setMyPlayerId(playerId);
      setMySeat(seatIndex);
      setRoom(roomInfo);
      setGameState(null);
      gameStateRef.current = null;
      setVersion(0);
      versionRef.current = 0;
      setCurrentPlayer(null);
      setRoomSyncReady(false);
      setMoveError(null);
      setPhase(
        roomInfo.status === "waiting"
          ? "waiting"
          : roomInfo.status === "finished"
            ? "finished"
            : "playing"
      );
      const me = roomInfo.players.find((p) => p.playerId === playerId);
      savePendingJoin(roomInfo.code, me?.displayName ?? "プレイヤー", {
        roomId,
        playerId,
        seatIndex,
      });
      if (me?.displayName) {
        saveLastDisplayName(me.displayName);
      }
      const cleanup = subscribeRealtime(roomId);
      if (cleanup) {
        realtimeCleanupRef.current = cleanup;
      }
      void refreshRoom(roomId, { playerId });
      return cleanup;
    },
    [clearRealtime, refreshRoom, subscribeRealtime]
  );

  const reset = useCallback(() => {
    clearRealtime();
    setPhase("idle");
    setRoom(null);
    setGameState(null);
    gameStateRef.current = null;
    setVersion(0);
    versionRef.current = 0;
    setCurrentPlayer(null);
    setMyPlayerId("");
    setMySeat(-1);
    setError(null);
    pendingUrlJoinRef.current = null;
  }, [clearRealtime]);

  const clearRoomQuery = useCallback(() => {
    router.replace(`/play/${gameSlug}`, { scroll: false });
  }, [router, gameSlug]);

  const completeJoinWithCode = useCallback(
    async (
      code: string,
      displayName: string,
      session?: { roomId: string; playerId: string; seatIndex: number }
    ) => {
      setLoading(true);
      setError(null);
      try {
        let roomId: string;
        let playerId: string;
        let seatIndex: number;
        let resolvedCode: string;

        const result = await joinRoom(code, displayName);
        roomId = result.roomId;
        playerId = result.playerId;
        seatIndex = result.seatIndex;
        resolvedCode = result.code;

        const data = await fetchRoom(roomId);
        if (data.room.gameSlug !== gameSlug) {
          savePendingJoin(resolvedCode, displayName, session);
          reset();
          router.replace(
            `/play/${data.room.gameSlug}?room=${encodeURIComponent(resolvedCode)}`
          );
          return;
        }
        setupRoom(roomId, playerId, seatIndex, data.room);
        saveLastDisplayName(displayName.trim());
      } catch (e) {
        setError(e instanceof Error ? e.message : "部屋への参加に失敗しました");
      } finally {
        setLoading(false);
        pendingUrlJoinRef.current = null;
      }
    },
    [gameSlug, setupRoom, reset, router, clearRoomQuery]
  );

  const joinCodeFromUrl = useMemo(() => {
    const raw = searchParams.get("room");
    if (!raw) return null;
    const normalized = normalizeRoomCodeInput(raw);
    return normalized.length >= 6 ? normalized : null;
  }, [searchParams]);

  const completingPendingJoin = useMemo(() => {
    if (room) return false;
    if (phase !== "idle" || !joinCodeFromUrl) return false;
    if (pendingJoinMatchesUrlCode(joinCodeFromUrl)) return true;
    return readLastDisplayName() != null;
  }, [room, phase, joinCodeFromUrl]);

  useEffect(() => {
    if (!joinCodeFromUrl || phase !== "idle" || room) return;
    if (pendingUrlJoinRef.current === joinCodeFromUrl) return;

    const pending = pendingJoinMatchesUrlCode(joinCodeFromUrl);
    const displayName =
      pending?.displayName ?? readLastDisplayName() ?? null;
    if (!displayName) return;

    pendingUrlJoinRef.current = joinCodeFromUrl;
    queueMicrotask(() => {
      void completeJoinWithCode(
        joinCodeFromUrl,
        displayName,
        pending?.session
      );
    });
  }, [joinCodeFromUrl, phase, room, completeJoinWithCode]);

  useEffect(() => {
    if (!room || room.gameSlug === gameSlug) return;
    const existing = readPendingJoin();
    if (!existing) {
      savePendingJoin(room.code, "プレイヤー");
    }
    const target = `/play/${room.gameSlug}?room=${encodeURIComponent(room.code)}`;
    clearRealtime();
    router.replace(target);
  }, [room, gameSlug, clearRealtime, router]);

  const handleCreate = useCallback(
    async (displayName: string, gameOptions?: Record<string, unknown>) => {
      setLoading(true);
      setError(null);
      try {
        const result = await createRoom(gameSlug, displayName, gameOptions);
        const data = await fetchRoom(result.roomId, result.playerId);
        setupRoom(result.roomId, result.playerId, result.seatIndex, data.room);
        saveLastDisplayName(displayName.trim());
      } catch (e) {
        setError(e instanceof Error ? e.message : "エラーが発生しました");
      } finally {
        setLoading(false);
      }
    },
    [gameSlug, setupRoom]
  );

  const handleJoin = useCallback(
    async (code: string, displayName: string) => {
      setLoading(true);
      setError(null);
      try {
        await joinRoomFlow({
          code,
          displayName,
          navigate: (path) => router.push(path),
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : "エラーが発生しました");
      } finally {
        setLoading(false);
      }
    },
    [router]
  );

  const handleUpdateGameOptions = useCallback(
    async (partial: Record<string, unknown>) => {
      if (!room || room.hostPlayerId !== myPlayerId) return;
      setError(null);
      setRoom((prev) => {
        if (!prev) return prev;
        const slug = prev.gameSlug as OnlineGameSlug;
        const merged = mergeGameOptions(slug, prev.gameOptions, partial);
        return merged ? { ...prev, gameOptions: merged as Record<string, unknown> } : prev;
      });
      try {
        await updateRoomGameOptions(room.id, myPlayerId, partial);
        await refreshRoom(room.id);
      } catch (e) {
        setError(e instanceof Error ? e.message : "設定の保存に失敗しました");
      }
    },
    [room, myPlayerId, refreshRoom]
  );

  const handleStart = useCallback(
    async (params?: StartRoomParams) => {
      if (!room) return;
      setLoading(true);
      setError(null);
      try {
        await startRoomGame(room.id, myPlayerId, params);
        // 開始の応答より先に盤が出て、先に手が進むことがある。
        // その版番号と待ち行列は消さない。秘密対戦の手札は refreshRoom が playerId 付きで取り直す。
        if (!pendingMoveRef.current) {
          moveQueueRef.current = [];
          setMovePending(false);
        }
        const data = await refreshRoom(room.id);
        if (
          data.gameState &&
          (data.gameState.state as GameState).phase !== "game-over" &&
          data.room.status === "playing"
        ) {
          setPhase("playing");
        }
        if (
          data.gameState &&
          !pendingMoveRef.current &&
          data.gameState.version >= versionRef.current
        ) {
          broadcastGameState(
            data.gameState.state as GameState,
            data.gameState.version,
            data.gameState.currentPlayer
          );
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "開始に失敗しました");
      } finally {
        setLoading(false);
      }
    },
    [room, myPlayerId, refreshRoom, broadcastGameState]
  );

  const handleRematch = useCallback(
    async (params?: StartRoomParams) => {
      if (!room || loading) return;
      const ended =
        phase === "finished" ||
        room.status === "finished" ||
        gameState?.phase === "game-over";
      if (!ended) return;
      moveQueueRef.current = [];
      pendingMoveRef.current = false;
      setMovePending(false);
      await handleStart(params);
    },
    [room, phase, gameState, handleStart, loading]
  );

  const applyServerMoveSuccess = useCallback(
    (
      serverState: GameState,
      serverVersion: number,
      serverCurrentPlayer: number | null
    ) => {
      versionRef.current = serverVersion;
      setVersion(serverVersion);
      setGameState(serverState);
      gameStateRef.current = serverState;
      let resolvedCurrentPlayer = serverCurrentPlayer;
      if (roomRef.current?.gameSlug === "dejarik") {
        const seat = dejarikTurnSeat(serverState as DejarikOnlineState);
        if (seat !== null) resolvedCurrentPlayer = seat;
      }
      setCurrentPlayer(resolvedCurrentPlayer);
      if (serverState.phase === "game-over") {
        setPhase("finished");
        setRoom((prev) =>
          prev && prev.status !== "finished"
            ? { ...prev, status: "finished" }
            : prev
        );
      }
      broadcastGameState(serverState, serverVersion, resolvedCurrentPlayer);
    },
    [broadcastGameState]
  );

  const sendMovePipelineRef = useRef<
    (
      move: MovePayload,
      expectedVersion: number,
      rollback: MoveRollback
    ) => Promise<void>
  >(async () => {});

  useEffect(() => {
    sendMovePipelineRef.current = (
      move: MovePayload,
      expectedVersion: number,
      rollback: MoveRollback
    ) => {
      if (!room) return Promise.resolve();

      pendingMoveRef.current = true;
      setMovePending(true);
      setMoveError(null);

      return sendRoomMove(room.id, myPlayerId, move, expectedVersion)
        .then((serverResult) => {
          if (moveQueueRef.current.length > 0) {
            applyServerMoveSuccess(
              serverResult.state as GameState,
              serverResult.version,
              serverResult.currentPlayer
            );
            const nextMove = moveQueueRef.current.shift()!;
            const accepted = serverResult.state as GameState;
            void sendMovePipelineRef.current(nextMove, serverResult.version, {
              state: accepted,
              version: serverResult.version,
              currentPlayer: serverResult.currentPlayer,
              phase: accepted.phase === "game-over" ? "finished" : "playing",
            });
            return;
          }

          applyServerMoveSuccess(
            serverResult.state as GameState,
            serverResult.version,
            serverResult.currentPlayer
          );
          pendingMoveRef.current = false;
          setMovePending(false);
        })
        .catch((e) => {
          moveQueueRef.current = [];
          const secretInFlight = isOnlineSecretGame(room.gameSlug);
          const newerLanded = versionRef.current > rollback.version;
          if (!(secretInFlight && newerLanded)) {
            setGameState(rollback.state);
            gameStateRef.current = rollback.state;
            setVersion(rollback.version);
            versionRef.current = rollback.version;
            setCurrentPlayer(rollback.currentPlayer);
            setPhase(rollback.phase);
            if (isOnlineSecretGame(room.gameSlug)) {
              broadcastGameState(
                rollback.state,
                rollback.version,
                rollback.currentPlayer
              );
            }
          }
          const message =
            e instanceof Error ? e.message : "手の送信に失敗しました";
          setMoveError(message);
          setError(message);
          void refreshRoom(room.id);
          pendingMoveRef.current = false;
          setMovePending(false);
          if (secretInFlight) {
            throw e;
          }
        });
    };
  }, [
    room,
    myPlayerId,
    applyServerMoveSuccess,
    refreshRoom,
    broadcastGameState,
  ]);

  const sendMovePipeline = useCallback(
    (move: MovePayload, expectedVersion: number, rollback: MoveRollback) => {
      return sendMovePipelineRef.current(move, expectedVersion, rollback);
    },
    []
  );

  const handleMove = useCallback(
    (move: MovePayload) => {
      if (!room || mySeat < 0) return;
      const liveState = gameStateRef.current;
      if (!liveState) return;

      const slug = room.gameSlug as OnlineGameSlug;
      if (isOnlineSecretGame(slug)) {
        if (liveState.phase === "game-over") return;
        const view = liveState as import("@/lib/play/king-and-spy/types").KingAndSpyViewState;
        const rollback: MoveRollback = {
          state: liveState,
          version: versionRef.current,
          currentPlayer,
          phase,
        };
        if (move.type === "king-and-spy-hand-ready") {
          if (view.showcase) return;
          if (view.handReady?.[mySeat]) return;
          if (!view.committedReady?.[mySeat]) return;
          return sendMovePipeline(move, rollback.version, rollback);
        }
        if (view.committedReady?.[mySeat]) return;
        if (move.type !== "king-and-spy-commit") return;

        return sendMovePipeline(move, rollback.version, rollback);
      }

      const actorSeat = turnSeatForState(slug, liveState);
      const chainedExtraTurn =
        pendingMoveRef.current &&
        liveState.phase !== "game-over" &&
        actorSeat === mySeat;

      const onTurn =
        chainedExtraTurn ||
        currentPlayer === mySeat ||
        (actorSeat !== null && actorSeat === mySeat);
      if (!onTurn) return;

      const result = applyMove(
        slug,
        liveState,
        mySeat,
        move,
        room.gameOptions
      );
      if ("error" in result) return;

      const rollbackSeat = turnSeatForState(slug, liveState);
      const rollbackCurrent =
        rollbackSeat !== null
          ? rollbackSeat
          : currentPlayer !== null
            ? currentPlayer
            : actorSeat;

      if (isServerRandomMove(move)) {
        const rollback: MoveRollback = {
          state: liveState,
          version: versionRef.current,
          currentPlayer: rollbackCurrent,
          phase,
        };
        sendMovePipeline(move, versionRef.current, rollback);
        return;
      }

      const wasChained = pendingMoveRef.current;
      const rollback: MoveRollback = {
        state: liveState,
        version: versionRef.current,
        currentPlayer: rollbackCurrent,
        phase: liveState.phase === "game-over" ? "finished" : phase,
      };

      if (wasChained) {
        moveQueueRef.current.push(move);
        return;
      }

      sendMovePipeline(move, versionRef.current, rollback);
    },
    [room, mySeat, currentPlayer, phase, sendMovePipeline]
  );

  const isHost = room?.hostPlayerId === myPlayerId;
  const isMyTurn = useMemo(() => {
    if (mySeat < 0) return false;
    if (room?.gameSlug && isOnlineSecretGame(room.gameSlug) && gameState) {
      const view = gameState as import("@/lib/play/king-and-spy/types").KingAndSpyViewState;
      if (view.committedReady) {
        return view.phase !== "game-over" && !view.committedReady[mySeat];
      }
    }
    const slug = room?.gameSlug as OnlineGameSlug | undefined;
    if (gameState && slug) {
      const seat = turnSeatForState(slug, gameState);
      if (seat !== null) return seat === mySeat;
    }
    return currentPlayer === mySeat;
  }, [room?.gameSlug, gameState, mySeat, currentPlayer]);
  const resolvedPlayerId = myPlayerId || getOrCreatePlayerId();
  const players = room?.players ?? EMPTY_PLAYERS;
  const maxPlayers = room?.maxPlayers ?? 2;
  const canStart = players.length === maxPlayers;

  const rematchLoading = isOnlineRematchLoading(
    loading,
    phase,
    room?.status,
    gameState?.phase
  );

  return useMemo(
    () => ({
      phase,
      room,
      gameState,
      version,
      currentPlayer,
      myPlayerId: resolvedPlayerId,
      mySeat,
      isHost,
      isMyTurn,
      players,
      maxPlayers,
      canStart,
      error,
      loading,
      rematchLoading,
      movePending,
      moveError,
      roomSyncReady,
      handleCreate,
      handleJoin,
      handleUpdateGameOptions,
      handleStart,
      handleRematch,
      handleMove,
      reset,
      refreshRoom,
      joinCodeFromUrl,
      completingPendingJoin,
    }),
    [
      phase,
      room,
      gameState,
      version,
      currentPlayer,
      resolvedPlayerId,
      mySeat,
      isHost,
      isMyTurn,
      players,
      maxPlayers,
      canStart,
      error,
      loading,
      rematchLoading,
      movePending,
      moveError,
      roomSyncReady,
      handleCreate,
      handleJoin,
      handleUpdateGameOptions,
      handleStart,
      handleRematch,
      handleMove,
      reset,
      refreshRoom,
      joinCodeFromUrl,
      completingPendingJoin,
    ]
  );
}
