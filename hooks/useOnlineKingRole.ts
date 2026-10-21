"use client";

import { useCallback, useState } from "react";
import { parseHostStartsAsKing } from "@/lib/play/king-and-spy/game-options";
import type { RoomInfo } from "@/lib/online/types";

type OnlinePhase = "idle" | "waiting" | "playing" | "finished";

type OnlineRoomSlice = {
  room: RoomInfo | null;
  phase: OnlinePhase;
  isHost: boolean;
  handleUpdateGameOptions: (partial: Record<string, unknown>) => Promise<void>;
};

export function useOnlineKingRole(online: OnlineRoomSlice) {
  const stored = parseHostStartsAsKing(online.room?.gameOptions);
  const roomId = online.room?.id ?? "";
  const [selectionByRoom, setSelectionByRoom] = useState<
    Record<string, boolean>
  >({});

  const selection = roomId ? selectionByRoom[roomId] : undefined;
  const hostStartsAsKing =
    online.phase === "finished"
      ? (selection ?? !stored)
      : online.phase === "waiting"
        ? (selection ?? stored)
        : stored;

  const onHostStartsAsKingChange = useCallback(
    (value: boolean) => {
      if (!roomId) return;
      setSelectionByRoom((prev) => ({ ...prev, [roomId]: value }));
      if (
        online.isHost &&
        (online.phase === "waiting" ||
          online.phase === "finished" ||
          online.room?.status === "waiting" ||
          online.room?.status === "finished")
      ) {
        void online.handleUpdateGameOptions({ hostStartsAsKing: value });
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

  return { hostStartsAsKing, onHostStartsAsKingChange };
}
