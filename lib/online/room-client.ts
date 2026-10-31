import type { MovePayload } from "./moves";
import { MOVE_CONFLICT_NOTICE } from "./move-sync";
import { getOrCreatePlayerId } from "./player-id";
import type { RoomGameState, RoomInfo, RoomPlayer } from "./types";

const noStore: RequestInit = { cache: "no-store" };

export class RoomMoveError extends Error {
  readonly status: number;
  readonly serverVersion: number | null;
  readonly gameState: RoomGameState | null;

  constructor(
    message: string,
    status: number,
    serverVersion: number | null,
    gameState: RoomGameState | null
  ) {
    super(message);
    this.name = "RoomMoveError";
    this.status = status;
    this.serverVersion = serverVersion;
    this.gameState = gameState;
  }
}

function conflictGameState(body: unknown): {
  serverVersion: number | null;
  gameState: RoomGameState | null;
} {
  if (!body || typeof body !== "object") {
    return { serverVersion: null, gameState: null };
  }
  const record = body as {
    version?: unknown;
    gameState?: unknown;
  };
  const topVersion =
    typeof record.version === "number" ? record.version : null;
  const raw = record.gameState;
  if (!raw || typeof raw !== "object") {
    return { serverVersion: topVersion, gameState: null };
  }
  const gameState = raw as RoomGameState;
  const version =
    typeof gameState.version === "number" ? gameState.version : topVersion;
  if (version == null || gameState.state == null) {
    return { serverVersion: topVersion, gameState: null };
  }
  return {
    serverVersion: version,
    gameState: { ...gameState, version },
  };
}

type CreateRoomResponse = {
  roomId: string;
  code: string;
  playerId: string;
  seatIndex: number;
};

export type JoinRoomResponse = {
  roomId: string;
  code: string;
  playerId: string;
  seatIndex: number;
  status: string;
  gameSlug: string;
  players: RoomPlayer[];
  hostPlayerId: string;
  gameOptions?: Record<string, unknown>;
};

export async function createRoom(
  gameSlug: string,
  displayName: string,
  gameOptions?: Record<string, unknown>
): Promise<CreateRoomResponse> {
  const playerId = getOrCreatePlayerId();
  const res = await fetch("/api/rooms/create", {
    ...noStore,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ gameSlug, displayName, playerId, gameOptions }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "部屋の作成に失敗しました");
  }
  return res.json();
}

export async function joinRoom(
  code: string,
  displayName: string
): Promise<JoinRoomResponse> {
  const playerId = getOrCreatePlayerId();
  const res = await fetch("/api/rooms/join", {
    ...noStore,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, displayName, playerId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "部屋への参加に失敗しました");
  }
  return res.json();
}

export async function fetchRoom(
  roomId: string,
  playerId?: string
): Promise<{
  room: RoomInfo;
  gameState: RoomGameState | null;
}> {
  const query = playerId
    ? `?playerId=${encodeURIComponent(playerId)}`
    : "";
  const res = await fetch(`/api/rooms/${roomId}${query}`, noStore);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "部屋情報の取得に失敗しました");
  }
  return res.json();
}

export type StartRoomParams = {
  firstPlayer?: number;
  gameOptions?: Record<string, unknown>;
};

export async function startRoomGame(
  roomId: string,
  playerId: string,
  params?: StartRoomParams
): Promise<void> {
  const res = await fetch(`/api/rooms/${roomId}/start`, {
    ...noStore,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      playerId,
      firstPlayer: params?.firstPlayer,
      gameOptions: params?.gameOptions,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "ゲームの開始に失敗しました");
  }
}

export async function updateRoomGameOptions(
  roomId: string,
  playerId: string,
  gameOptions: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const res = await fetch(`/api/rooms/${roomId}/options`, {
    ...noStore,
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ playerId, gameOptions }),
  });
  const body = (await res.json().catch(() => ({}))) as {
    error?: string;
    gameOptions?: Record<string, unknown>;
  };
  if (!res.ok) {
    throw new Error(body.error ?? "設定の保存に失敗しました");
  }
  return (body.gameOptions as Record<string, unknown> | undefined) ?? gameOptions;
}

export async function sendRoomMove(
  roomId: string,
  playerId: string,
  move: MovePayload,
  expectedVersion: number
): Promise<RoomGameState> {
  const res = await fetch(`/api/rooms/${roomId}/move`, {
    ...noStore,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ playerId, move, expectedVersion }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const conflict = conflictGameState(err);
    const message =
      err.error === "State conflict"
        ? MOVE_CONFLICT_NOTICE
        : (err.error ?? "手の送信に失敗しました");
    throw new RoomMoveError(
      message,
      res.status,
      conflict.serverVersion,
      conflict.gameState
    );
  }
  const data = await res.json();
  return data.gameState;
}
