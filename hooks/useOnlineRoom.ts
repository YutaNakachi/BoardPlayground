"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePlayPage } from "@/components/play/PlayPageContext";
import { applyMove, type GameState, type MovePayload } from "@/lib/online/moves";
import { getOrCreatePlayerId } from "@/lib/online/player-id";
import type { FirstPlayerSeat } from "@/lib/online/game-options";
import {
  createRoom,
  fetchRoom,
  joinRoom,
  sendRoomMove,
  startRoomGame,
  updateRoomGameOptions,
} from "@/lib/online/room-client";
import { shouldApplyRemoteGameVersion } from "@/lib/online/sync-game-state";
import type { OnlineGameSlug, RoomInfo, RoomPlayer } from "@/lib/online/types";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type OnlinePhase = "idle" | "waiting" | "playing" | "finished";

const EMPTY_PLAYERS: RoomPlayer[] = [];

export function useOnlineRoom(gameSlug: string) {
  const { registerPlayExit } = usePlayPage();
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
  const versionRef = useRef(0);
  const pendingMoveRef = useRef(false);

  const clearRealtime = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    realtimeCleanupRef.current?.();
    realtimeCleanupRef.current = undefined;
    pendingMoveRef.current = false;
  }, []);

  useEffect(() => {
    versionRef.current = version;
  }, [version]);

  const applyRemoteGameState = useCallback(
    (
      state: GameState,
      remoteVersion: number,
      remoteCurrentPlayer: number | null
    ) => {
      if (pendingMoveRef.current) return;
      if (
        !shouldApplyRemoteGameVersion(remoteVersion, versionRef.current, state)
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
  }, [applyRemoteGameState]);

  const subscribeRealtime = useCallback(
    (roomId: string) => {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) {
        pollRef.current = setInterval(() => {
          void refreshRoom(roomId);
        }, 2000);
        return;
      }

      const channel = supabase
        .channel(`room-${roomId}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "room_state",
            filter: `room_id=eq.${roomId}`,
          },
          (payload) => {
            const row = payload.new as {
              state: GameState;
              version: number;
              current_player: number | null;
            };
            applyRemoteGameState(row.state, row.version, row.current_player);
          }
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "rooms",
            filter: `id=eq.${roomId}`,
          },
          (payload) => {
            const row = payload.new as { status: RoomInfo["status"] };
            if (row.status === "playing") setPhase("playing");
            if (row.status === "finished") setPhase("finished");
            if (row.status === "waiting") setPhase("waiting");
          }
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "room_players",
            filter: `room_id=eq.${roomId}`,
          },
          () => {
            void refreshRoom(roomId);
          }
        )
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            if (pollRef.current) {
              clearInterval(pollRef.current);
              pollRef.current = null;
            }
            return;
          }
          if (
            status === "CHANNEL_ERROR" ||
            status === "TIMED_OUT" ||
            status === "CLOSED"
          ) {
            if (!pollRef.current) {
              pollRef.current = setInterval(() => {
                void refreshRoom(roomId);
              }, 2000);
            }
          }
        });

      return () => {
        void supabase.removeChannel(channel);
      };
    },
    [applyRemoteGameState, refreshRoom]
  );

  useEffect(() => {
    return registerPlayExit(clearRealtime);
  }, [registerPlayExit, clearRealtime]);

  useEffect(() => {
    return clearRealtime;
  }, [clearRealtime]);

  const setupRoom = useCallback(
    (roomId: string, playerId: string, seatIndex: number, roomInfo: RoomInfo) => {
      clearRealtime();
      setMyPlayerId(playerId);
      setMySeat(seatIndex);
      setRoom(roomInfo);
      setPhase(roomInfo.status === "waiting" ? "waiting" : "playing");
      const cleanup = subscribeRealtime(roomId);
      if (cleanup) {
        realtimeCleanupRef.current = cleanup;
      }
      void refreshRoom(roomId);
      return cleanup;
    },
    [clearRealtime, refreshRoom, subscribeRealtime]
  );

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
        const result = await joinRoom(code, displayName);
        const data = await fetchRoom(result.roomId);
        setupRoom(result.roomId, result.playerId, result.seatIndex, data.room);
      } catch (e) {
        setError(e instanceof Error ? e.message : "エラーが発生しました");
      } finally {
        setLoading(false);
      }
    },
    [setupRoom]
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
    async (firstPlayer?: FirstPlayerSeat) => {
      if (!room) return;
      setLoading(true);
      setError(null);
      try {
        await startRoomGame(room.id, myPlayerId, firstPlayer);
        pendingMoveRef.current = false;
        versionRef.current = 0;
        await refreshRoom(room.id);
        setPhase("playing");
      } catch (e) {
        setError(e instanceof Error ? e.message : "開始に失敗しました");
      } finally {
        setLoading(false);
      }
    },
    [room, myPlayerId, refreshRoom]
  );

  const handleRematch = useCallback(
    async (firstPlayer?: FirstPlayerSeat) => {
      if (!room || phase !== "finished") return;
      await handleStart(firstPlayer);
    },
    [room, phase, handleStart]
  );

  const handleMove = useCallback(
    (move: MovePayload) => {
      if (!room || gameState === null || mySeat < 0) return;
      if (currentPlayer !== mySeat) return;

      const slug = gameSlug as OnlineGameSlug;
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

      void sendRoomMove(room.id, myPlayerId, move, prevVersion)
        .then((serverResult) => {
          setGameState(serverResult.state as GameState);
          setVersion(serverResult.version);
          versionRef.current = serverResult.version;
          setCurrentPlayer(serverResult.currentPlayer);
          if ((serverResult.state as GameState).phase === "game-over") {
            setPhase("finished");
          }
        })
        .catch((e) => {
          setGameState(prevState);
          setVersion(prevVersion);
          versionRef.current = prevVersion;
          setCurrentPlayer(prevCurrentPlayer);
          setPhase(prevPhase);
          setError(e instanceof Error ? e.message : "手の送信に失敗しました");
          void refreshRoom(room.id);
        })
        .finally(() => {
          pendingMoveRef.current = false;
        });
    },
    [room, gameState, mySeat, currentPlayer, phase, gameSlug, myPlayerId, refreshRoom]
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
  }, [clearRealtime]);

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
    ]
  );
}
