"use client";

import { useCallback, useState } from "react";
import { parseDotsBoxesSize } from "@/lib/online/game-options";
import type { RoomInfo } from "@/lib/online/types";
import type { DotsBoxesSize } from "@/lib/play/dots-and-boxes";

type OnlinePhase = "idle" | "waiting" | "playing" | "finished";

type OnlineRoomSlice = {
  room: RoomInfo | null;
  phase: OnlinePhase;
  isHost: boolean;
  handleUpdateGameOptions: (partial: Record<string, unknown>) => Promise<void>;
};

export function useOnlineDotsBoxesSize(online: OnlineRoomSlice) {
  const stored = parseDotsBoxesSize(online.room?.gameOptions);
  const roomId = online.room?.id ?? "";
  const [selectionByRoom, setSelectionByRoom] = useState<
    Record<string, DotsBoxesSize>
  >({});

  const selection = roomId ? selectionByRoom[roomId] : undefined;
  const size = selection ?? stored;

  const canPersist =
    online.isHost &&
    (online.phase === "waiting" ||
      online.phase === "finished" ||
      online.room?.status === "waiting" ||
      online.room?.status === "finished");

  const onSizeChange = useCallback(
    (next: DotsBoxesSize) => {
      if (!roomId) return;
      setSelectionByRoom((prev) => ({ ...prev, [roomId]: next }));
      if (canPersist) {
        void online.handleUpdateGameOptions({ size: next });
      }
    },
    [roomId, canPersist, online.handleUpdateGameOptions]
  );

  return { size, onSizeChange };
}
