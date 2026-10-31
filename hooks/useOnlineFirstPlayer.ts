"use client";

import { useCallback } from "react";
import { requiredPlayerCountFromRoom } from "@/lib/online/game-options";
import {
  explicitOpeningSeat,
  openingSeatCount,
  shownOpeningSeat,
} from "@/lib/online/first-player-sync";
import type { RoomInfo } from "@/lib/online/types";

type OnlinePhase = "idle" | "waiting" | "playing" | "finished";

type OnlineRoomSlice = {
  room: RoomInfo | null;
  phase: OnlinePhase;
  isHost: boolean;
  handleUpdateGameOptions: (partial: Record<string, unknown>) => Promise<void>;
};

/**
 * 先攻は全席ともサーバーの gameOptions を表示する。
 * ホストの選択は options 更新で部屋に書き、参加者は同じ値をポーリングと broadcast で受け取る。
 */
export function useOnlineFirstPlayer(online: OnlineRoomSlice) {
  const { room, phase, isHost, handleUpdateGameOptions } = online;
  const slug = room?.gameSlug ?? "";
  const cap = room
    ? requiredPlayerCountFromRoom(slug, room.gameOptions, room.maxPlayers)
    : 2;
  const explicit = explicitOpeningSeat(room?.gameOptions);
  const seatCount = openingSeatCount(cap, explicit);
  const firstPlayer = shownOpeningSeat(room?.gameOptions, cap);
  const roomStatus = room?.status;

  const onFirstPlayerChange = useCallback(
    (seat: number) => {
      if (
        !isHost ||
        (phase !== "waiting" &&
          phase !== "finished" &&
          roomStatus !== "waiting" &&
          roomStatus !== "finished")
      ) {
        return;
      }
      void handleUpdateGameOptions({ firstPlayer: seat });
    },
    [isHost, phase, roomStatus, handleUpdateGameOptions]
  );

  return { firstPlayer, onFirstPlayerChange, seatCount };
}
