import type { MovePayload } from "./moves";
import { getOrCreatePlayerId } from "./player-id";
import type { RoomGameState, RoomInfo, RoomPlayer } from "./types";

type CreateRoomResponse = {
  roomId: string;
  code: string;
  playerId: string;
  seatIndex: number;
};

type JoinRoomResponse = {
  roomId: string;
  code: string;
  playerId: string;
  seatIndex: number;
  status: string;
  players: RoomPlayer[];
  hostPlayerId: string;
};

export async function createRoom(
  gameSlug: string,
  passphrase: string,
  displayName: string
): Promise<CreateRoomResponse> {
  const playerId = getOrCreatePlayerId();
  const res = await fetch("/api/rooms/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ gameSlug, passphrase, displayName, playerId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "部屋の作成に失敗しました");
  }
  return res.json();
}

export async function joinRoom(
  code: string,
  passphrase: string,
  displayName: string
): Promise<JoinRoomResponse> {
  const playerId = getOrCreatePlayerId();
  const res = await fetch("/api/rooms/join", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, passphrase, displayName, playerId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "部屋への参加に失敗しました");
  }
  return res.json();
}

export async function fetchRoom(roomId: string): Promise<{
  room: RoomInfo;
  gameState: RoomGameState | null;
}> {
  const res = await fetch(`/api/rooms/${roomId}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "部屋情報の取得に失敗しました");
  }
  return res.json();
}

export async function startRoomGame(roomId: string, playerId: string): Promise<void> {
  const res = await fetch(`/api/rooms/${roomId}/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ playerId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "ゲームの開始に失敗しました");
  }
}

export async function sendRoomMove(
  roomId: string,
  playerId: string,
  move: MovePayload,
  expectedVersion: number
): Promise<RoomGameState> {
  const res = await fetch(`/api/rooms/${roomId}/move`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ playerId, move, expectedVersion }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "手の送信に失敗しました");
  }
  const data = await res.json();
  return data.gameState;
}
