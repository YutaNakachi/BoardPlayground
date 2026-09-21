"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePlayPage } from "@/components/play/PlayPageContext";
import { applyMove, type GameState, type MovePayload } from "@/lib/online/moves";
import { getOrCreatePlayerId } from "@/lib/online/player-id";
import {
  createRoom,
  fetchRoom,
  joinRoom,
  sendRoomMove,
  startRoomGame,
} from "@/lib/online/room-client";
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

  const refreshRoom = useCallback(async (roomId: string) => {
    const data = await fetchRoom(roomId);
    setRoom(data.room);
    if (data.gameState) {
      setGameState(data.gameState.state as GameState);
      setVersion(data.gameState.version);
      setCurrentPlayer(data.gameState.currentPlayer);
      if (data.room.status === "playing") setPhase("playing");
      if (data.room.status === "finished") setPhase("finished");
    } else if (data.room.status === "waiting") {
      setPhase("waiting");
    }
  }, []);

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
            if (pendingMoveRef.current) return;
            const row = payload.new as {
              state: GameState;
              version: number;
              current_player: number | null;
            };
            setGameState(row.state);
            setVersion(row.version);
            setCurrentPlayer(row.current_player);
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
        .subscribe();

      return () => {
        void supabase.removeChannel(channel);
      };
    },
    [refreshRoom]
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
    async (displayName: string) => {
      setLoading(true);
      setError(null);
      try {
        const result = await createRoom(gameSlug, displayName);
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

  const handleStart = useCallback(async () => {
    if (!room) return;
    setLoading(true);
    setError(null);
    try {
      await startRoomGame(room.id, myPlayerId);
      await refreshRoom(room.id);
      setPhase("playing");
    } catch (e) {
      setError(e instanceof Error ? e.message : "開始に失敗しました");
    } finally {
      setLoading(false);
    }
  }, [room, myPlayerId, refreshRoom]);

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
      setGameState(result.state);
      setCurrentPlayer(result.currentPlayer);
      setVersion(prevVersion + 1);
      if (result.state.phase === "game-over") {
        setPhase("finished");
      }

      void sendRoomMove(room.id, myPlayerId, move, prevVersion)
        .then((serverResult) => {
          setGameState(serverResult.state as GameState);
          setVersion(serverResult.version);
          setCurrentPlayer(serverResult.currentPlayer);
          if ((serverResult.state as GameState).phase === "game-over") {
            setPhase("finished");
          }
        })
        .catch((e) => {
          setGameState(prevState);
          setVersion(prevVersion);
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
      handleStart,
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
      handleStart,
      handleMove,
      reset,
      refreshRoom,
    ]
  );
}
