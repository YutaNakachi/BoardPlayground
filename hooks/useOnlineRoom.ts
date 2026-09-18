"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { GameState, MovePayload } from "@/lib/online/moves";
import { getOrCreatePlayerId } from "@/lib/online/player-id";
import {
  createRoom,
  fetchRoom,
  joinRoom,
  sendRoomMove,
  startRoomGame,
} from "@/lib/online/room-client";
import type { RoomInfo, RoomPlayer } from "@/lib/online/types";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type OnlinePhase = "idle" | "waiting" | "playing" | "finished";

export function useOnlineRoom(gameSlug: string) {
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
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const setupRoom = useCallback(
    (roomId: string, playerId: string, seatIndex: number, roomInfo: RoomInfo) => {
      setMyPlayerId(playerId);
      setMySeat(seatIndex);
      setRoom(roomInfo);
      setPhase(roomInfo.status === "waiting" ? "waiting" : "playing");
      const cleanup = subscribeRealtime(roomId);
      void refreshRoom(roomId);
      return cleanup;
    },
    [refreshRoom, subscribeRealtime]
  );

  const handleCreate = useCallback(
    async (passphrase: string, displayName: string) => {
      setLoading(true);
      setError(null);
      try {
        const result = await createRoom(gameSlug, passphrase, displayName);
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
    async (code: string, passphrase: string, displayName: string) => {
      setLoading(true);
      setError(null);
      try {
        const result = await joinRoom(code, passphrase, displayName);
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
    async (move: MovePayload) => {
      if (!room) return;
      setError(null);
      try {
        const result = await sendRoomMove(room.id, myPlayerId, move, version);
        setGameState(result.state as GameState);
        setVersion(result.version);
        setCurrentPlayer(result.currentPlayer);
        if ((result.state as GameState).phase === "game-over") {
          setPhase("finished");
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "手の送信に失敗しました");
        await refreshRoom(room.id);
      }
    },
    [room, myPlayerId, version, refreshRoom]
  );

  const reset = useCallback(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    setPhase("idle");
    setRoom(null);
    setGameState(null);
    setVersion(0);
    setCurrentPlayer(null);
    setMyPlayerId("");
    setMySeat(-1);
    setError(null);
  }, []);

  const isHost = room?.hostPlayerId === myPlayerId;
  const isMyTurn = currentPlayer === mySeat;
  const players: RoomPlayer[] = room?.players ?? [];

  return {
    phase,
    room,
    gameState,
    version,
    currentPlayer,
    myPlayerId: myPlayerId || getOrCreatePlayerId(),
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
  };
}
