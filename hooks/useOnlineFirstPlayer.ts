"use client";

import { useCallback, useState } from "react";
import {
  parseFirstPlayer,
  type FirstPlayerSeat,
} from "@/lib/online/game-options";
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
  const storedFirstPlayer = parseFirstPlayer(online.room?.gameOptions);
  const roomId = online.room?.id ?? "";
  const [selectionByRoom, setSelectionByRoom] = useState<
    Record<string, FirstPlayerSeat>
  >({});

  const selection = roomId ? selectionByRoom[roomId] : undefined;
  const rematchDefault: FirstPlayerSeat = storedFirstPlayer === 0 ? 1 : 0;
  const firstPlayer =
    online.phase === "finished"
      ? (selection ?? rematchDefault)
      : (selection ?? storedFirstPlayer);

  const onFirstPlayerChange = useCallback(
    (seat: FirstPlayerSeat) => {
      if (!roomId) return;
      setSelectionByRoom((prev) => ({ ...prev, [roomId]: seat }));
      if (online.isHost && online.room?.status === "waiting") {
        void online.handleUpdateGameOptions({ firstPlayer: seat });
      }
    },
    [roomId, online.isHost, online.room?.status, online.handleUpdateGameOptions]
  );

  return { firstPlayer, onFirstPlayerChange };
}
