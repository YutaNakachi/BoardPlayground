"use client";

import { useCallback, useState } from "react";
import { parseOpeningSeat } from "@/lib/online/player-count";
import { requiredPlayerCountFromRoom } from "@/lib/online/game-options";
import type { RoomInfo, RoomPlayer } from "@/lib/online/types";

type OnlinePhase = "idle" | "waiting" | "playing" | "finished";

type OnlineRoomSlice = {
  room: RoomInfo | null;
  players: RoomPlayer[];
  phase: OnlinePhase;
  isHost: boolean;
  handleUpdateGameOptions: (partial: Record<string, unknown>) => Promise<void>;
};

export function useOnlineFirstPlayer(online: OnlineRoomSlice) {
  const slug = online.room?.gameSlug ?? "";
  const seatCount = online.room
    ? requiredPlayerCountFromRoom(
        slug,
        online.room.gameOptions,
        online.room.maxPlayers
      )
    : 2;
  const storedOpening =
    parseOpeningSeat(online.room?.gameOptions, seatCount) ?? 0;
  const roomId = online.room?.id ?? "";
  const [selectionByRoom, setSelectionByRoom] = useState<
    Record<string, number>
  >({});

  const selection = roomId ? selectionByRoom[roomId] : undefined;
  const rematchDefault = (storedOpening + 1) % seatCount;
  const firstPlayer =
    online.phase === "finished"
      ? (selection ?? rematchDefault)
      : (selection ?? storedOpening);

  const onFirstPlayerChange = useCallback(
    (seat: number) => {
      if (!roomId) return;
      setSelectionByRoom((prev) => ({ ...prev, [roomId]: seat }));
      if (
        online.isHost &&
        (online.phase === "waiting" ||
          online.phase === "finished" ||
          online.room?.status === "waiting" ||
          online.room?.status === "finished")
      ) {
        void online.handleUpdateGameOptions({ firstPlayer: seat });
      }
    },
    [
      roomId,
      online.isHost,
      online.phase,
      online.room?.status,
      online.handleUpdateGameOptions,
    ]
  );

  return { firstPlayer, onFirstPlayerChange, seatCount };
}
