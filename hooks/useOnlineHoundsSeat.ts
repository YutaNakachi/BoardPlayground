"use client";

import { useCallback, useState } from "react";
import {
  parseHoundsSeat,
  type HoundsSeat,
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

export function useOnlineHoundsSeat(online: OnlineRoomSlice) {
  const storedHoundsSeat = parseHoundsSeat(online.room?.gameOptions);
  const roomId = online.room?.id ?? "";
  const [selectionByRoom, setSelectionByRoom] = useState<
    Record<string, HoundsSeat>
  >({});

  const selection = roomId ? selectionByRoom[roomId] : undefined;
  const rematchDefault: HoundsSeat = storedHoundsSeat === 0 ? 1 : 0;
  const houndsSeat =
    online.phase === "finished"
      ? (selection ?? rematchDefault)
      : online.phase === "waiting"
        ? (selection ?? storedHoundsSeat)
        : storedHoundsSeat;

  const onHoundsSeatChange = useCallback(
    (seat: HoundsSeat) => {
      if (!roomId) return;
      setSelectionByRoom((prev) => ({ ...prev, [roomId]: seat }));
      if (
        online.isHost &&
        (online.phase === "waiting" ||
          online.phase === "finished" ||
          online.room?.status === "waiting" ||
          online.room?.status === "finished")
      ) {
        void online.handleUpdateGameOptions({ houndsSeat: seat });
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

  return { houndsSeat, onHoundsSeatChange };
}
