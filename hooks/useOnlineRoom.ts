"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { usePlayPage } from "@/components/play/PlayPageContext";
import { joinRoomFlow } from "@/lib/online/join-room-flow";
import {
  clearPendingJoin,
  readPendingJoin,
  savePendingJoin,
} from "@/lib/online/join-room-pending";
import { applyMove, type GameState, type MovePayload } from "@/lib/online/moves";
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
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const realtimeCleanupRef = useRef<(() => void) | undefined>(undefined);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const versionRef = useRef(0);
  const gameStateRef = useRef<GameState | null>(null);
  const pendingMoveRef = useRef(false);

  const broadcastGameState = useCallback(
    (state: GameState, remoteVersion: number, remoteCurrentPlayer: number | null) => {
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
  }, []);

  useEffect(() => {
    versionRef.current = version;
  }, [version]);

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  const applyRemoteGameState = useCallback(
    (
      state: GameState,
      remoteVersion: number,
      remoteCurrentPlayer: number | null
    ) => {
      if (pendingMoveRef.current) return;
      if (
        !shouldApplyRemoteGameVersion(
          remoteVersion,
          versionRef.current,
          state,
          gameStateRef.current
        )
      ) {
        return;
      }
      setGameState(state);
      setVersion(remoteVersion);
      versionRef.current = remoteVersion;
      setCurrentPlayer(remoteCurrentPlayer);
      if (state.phase === "playing") {
        setPhase("playing");
      } else if (state.phase === "game-over") {
        setPhase("finished");
        setRoom((prev) =>
          prev && prev.status !== "finished"
            ? { ...prev, status: "finished" }
            : prev
        );
      }
    },
    []
  );

  const refreshRoom = useCallback(async (roomId: string) => {
    const data = await fetchRoom(roomId);
    setRoom(data.room);
    if (data.gameState) {
      applyRemoteGameState(
        data.gameState.state as GameState,
        data.gameState.version,
        data.gameState.currentPlayer
      );
      if (data.room.status === "playing") setPhase("playing");
      if (data.room.status === "finished") setPhase("finished");
    } else if (data.room.status === "waiting") {
      setPhase("waiting");
    }
    return data;
  }, [applyRemoteGameState]);

  const startPoll = useCallback(
    (roomId: string) => {
      if (pollRef.current) return;
      pollRef.current = setInterval(() => {
        void refreshRoom(roomId);
      }, 1000);
    },
    [refreshRoom]
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
        applyRemoteGameState(row.state, row.version, row.current_player);
      };

      const channel = supabase
        .channel(`room-${roomId}`, {
          config: { broadcast: { ack: false, self: false } },
        })
        .on("broadcast", { event: "room_state" }, ({ payload }) => {
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
    [applyRemoteGameState, startPoll]
  );

  useEffect(() => {
    return registerPlayExit(clearRealtime);
  }, [registerPlayExit, clearRealtime]);

  useEffect(() => {
    return clearRealtime;
  }, [clearRealtime]);

  // Lobby: room_players is not in the Realtime publication, so poll while waiting.
  useEffect(() => {
    if (phase !== "waiting" || !room?.id || !getSupabaseBrowserClient()) return;
    startPoll(room.id);
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [phase, room?.id, startPoll]);

  const setupRoom = useCallback(
    (roomId: string, playerId: string, seatIndex: number, roomInfo: RoomInfo) => {
      clearRealtime();
      setMyPlayerId(playerId);
      setMySeat(seatIndex);
      setRoom(roomInfo);
      setPhase(
        roomInfo.status === "waiting"
          ? "waiting"
          : roomInfo.status === "finished"
            ? "finished"
            : "playing"
      );
      const cleanup = subscribeRealtime(roomId);
      if (cleanup) {
        realtimeCleanupRef.current = cleanup;
      }
      void refreshRoom(roomId);
      return cleanup;
    },
    [clearRealtime, refreshRoom, subscribeRealtime]
  );

  const reset = useCallback(() => {
    clearRealtime();
    setPhase("idle");
    setRoom(null);
    setGameState(null);
    setVersion(0);
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
    async (code: string, displayName: string) => {
      setLoading(true);
      setError(null);
      try {
        const result = await joinRoom(code, displayName);
        const data = await fetchRoom(result.roomId);
        if (data.room.gameSlug !== gameSlug) {
          savePendingJoin(result.code, displayName);
          reset();
          router.replace(
            `/play/${data.room.gameSlug}?room=${encodeURIComponent(result.code)}`
          );
          return;
        }
        setupRoom(result.roomId, result.playerId, result.seatIndex, data.room);
        clearPendingJoin();
        clearRoomQuery();
      } catch (e) {
        setError(e instanceof Error ? e.message : "部屋への参加に失敗しました");
        clearPendingJoin();
        clearRoomQuery();
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

  useEffect(() => {
    if (!joinCodeFromUrl || phase !== "idle") return;
    if (pendingUrlJoinRef.current === joinCodeFromUrl) return;

    const pending = readPendingJoin();
    if (
      !pending ||
      normalizeRoomCodeInput(pending.code) !== joinCodeFromUrl
    ) {
      return;
    }

    pendingUrlJoinRef.current = joinCodeFromUrl;
    queueMicrotask(() => {
      void completeJoinWithCode(joinCodeFromUrl, pending.displayName);
    });
  }, [joinCodeFromUrl, phase, completeJoinWithCode]);

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
        const data = await fetchRoom(result.roomId);
        setupRoom(result.roomId, result.playerId, result.seatIndex, data.room);
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
        pendingMoveRef.current = false;
        versionRef.current = 0;
        const data = await refreshRoom(room.id);
        setPhase("playing");
        if (data.gameState) {
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
      if (!room || phase !== "finished") return;
      await handleStart(params);
    },
    [room, phase, handleStart]
  );

  const handleMove = useCallback(
    (move: MovePayload) => {
      if (!room || gameState === null || mySeat < 0) return;
      if (currentPlayer !== mySeat) return;

      const slug = room.gameSlug as OnlineGameSlug;
      const result = applyMove(slug, gameState, mySeat, move);
      if ("error" in result) return;

      const prevState = gameState;
      const prevVersion = versionRef.current;
      const prevCurrentPlayer = currentPlayer;
      const prevPhase = phase;

      pendingMoveRef.current = true;
      const optimisticVersion = prevVersion + 1;
      setGameState(result.state);
      setCurrentPlayer(result.currentPlayer);
      setVersion(optimisticVersion);
      versionRef.current = optimisticVersion;
      if (result.state.phase === "game-over") {
        setPhase("finished");
      }

      broadcastGameState(result.state, optimisticVersion, result.currentPlayer);

      void sendRoomMove(room.id, myPlayerId, move, prevVersion)
        .then((serverResult) => {
          setGameState(serverResult.state as GameState);
          setVersion(serverResult.version);
          versionRef.current = serverResult.version;
          setCurrentPlayer(serverResult.currentPlayer);
          if ((serverResult.state as GameState).phase === "game-over") {
            setPhase("finished");
          }
          broadcastGameState(
            serverResult.state as GameState,
            serverResult.version,
            serverResult.currentPlayer
          );
        })
        .catch((e) => {
          setGameState(prevState);
          setVersion(prevVersion);
          versionRef.current = prevVersion;
          setCurrentPlayer(prevCurrentPlayer);
          setPhase(prevPhase);
          setError(e instanceof Error ? e.message : "手の送信に失敗しました");
          broadcastGameState(prevState, prevVersion, prevCurrentPlayer);
          void refreshRoom(room.id);
        })
        .finally(() => {
          pendingMoveRef.current = false;
        });
    },
    [
      room,
      gameState,
      mySeat,
      currentPlayer,
      phase,
      myPlayerId,
      refreshRoom,
      broadcastGameState,
    ]
  );

  const isHost = room?.hostPlayerId === myPlayerId;
  const isMyTurn = currentPlayer === mySeat;
  const resolvedPlayerId = myPlayerId || getOrCreatePlayerId();
  const players = room?.players ?? EMPTY_PLAYERS;

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
      error,
      loading,
      handleCreate,
      handleJoin,
      handleUpdateGameOptions,
      handleStart,
      handleRematch,
      handleMove,
      reset,
      refreshRoom,
      joinCodeFromUrl,
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
      error,
      loading,
      handleCreate,
      handleJoin,
      handleUpdateGameOptions,
      handleStart,
      handleRematch,
      handleMove,
      reset,
      refreshRoom,
      joinCodeFromUrl,
    ]
  );
}
