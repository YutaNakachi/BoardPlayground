"use client";

import { useCallback, useState } from "react";
import { parseTicTacToeGameOptions } from "@/lib/online/game-options";
import type { RoomInfo } from "@/lib/online/types";
import type { TttMode } from "@/lib/play/tic-tac-toe";

type OnlinePhase = "idle" | "waiting" | "playing" | "finished";

type OnlineRoomSlice = {
  room: RoomInfo | null;
  phase: OnlinePhase;
  isHost: boolean;
  handleUpdateGameOptions: (partial: Record<string, unknown>) => Promise<void>;
};

export function useOnlineTttMode(online: OnlineRoomSlice) {
  const stored = parseTicTacToeGameOptions(online.room?.gameOptions);
  const roomId = online.room?.id ?? "";
  const [selectionByRoom, setSelectionByRoom] = useState<Record<string, TttMode>>({});

  const selection = roomId ? selectionByRoom[roomId] : undefined;
  const mode = selection ?? stored.mode;

  const canPersist =
    online.isHost &&
    (online.room?.status === "waiting" || online.room?.status === "finished");

  const onModeChange = useCallback(
    (next: TttMode) => {
      if (!roomId) return;
      setSelectionByRoom((prev) => ({ ...prev, [roomId]: next }));
      if (canPersist) {
        void online.handleUpdateGameOptions({ mode: next });
      }
    },
    [roomId, canPersist, online.handleUpdateGameOptions]
  );

  return { mode, onModeChange };
}
