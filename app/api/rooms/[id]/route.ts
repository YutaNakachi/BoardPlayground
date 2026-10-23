import { NextResponse } from "next/server";
import { requireOnlineBackend } from "@/lib/api/require-online";
import type { GameState } from "@/lib/online/moves";
import { projectGameStateForSeat } from "@/lib/online/project-state";
import { loadRoomSecrets } from "@/lib/online/room-secrets";
import { isMissingGameOptionsColumn } from "@/lib/online/room-schema";
import { isOnlineSecretGame } from "@/lib/online/secret-games";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
  const backend = await requireOnlineBackend();
  if (backend instanceof Response) return backend;
  const { db } = backend;

  const { id } = await params;

  const roomSelectWithOptions = await db
    .from("rooms")
    .select("id, code, game_slug, status, host_player_id, expires_at, game_options")
    .eq("id", id)
    .maybeSingle();

  let room = roomSelectWithOptions.data;
  if (roomSelectWithOptions.error && isMissingGameOptionsColumn(roomSelectWithOptions.error)) {
    const roomSelectBase = await db
      .from("rooms")
      .select("id, code, game_slug, status, host_player_id, expires_at")
      .eq("id", id)
      .maybeSingle();
    room = roomSelectBase.data
      ? { ...roomSelectBase.data, game_options: {} }
      : null;
  } else if (roomSelectWithOptions.error) {
    console.error("[rooms/get]", roomSelectWithOptions.error.message);
    return NextResponse.json({ error: "部屋情報の取得に失敗しました" }, { status: 500 });
  }

  if (!room) {
    return NextResponse.json({ error: "部屋が見つかりません" }, { status: 404 });
  }

  if (new Date(room.expires_at) < new Date()) {
    return NextResponse.json({ error: "部屋の有効期限が切れています" }, { status: 410 });
  }

  const { data: players } = await db
    .from("room_players")
    .select("player_id, seat_index, display_name")
    .eq("room_id", id)
    .order("seat_index");

  const { data: stateRow } = await db
    .from("room_state")
    .select("state, version, current_player")
    .eq("room_id", id)
    .maybeSingle();

  const playerId = new URL(request.url).searchParams.get("playerId");
  let projectedState: GameState | null = stateRow
    ? (stateRow.state as GameState)
    : null;

  if (
    stateRow &&
    (room.status === "playing" || room.status === "finished") &&
    isOnlineSecretGame(room.game_slug) &&
    playerId
  ) {
    const member = (players ?? []).find((p) => p.player_id === playerId);
    if (member) {
      const secretsRow = await loadRoomSecrets(db, id);
      projectedState = projectGameStateForSeat(
        room.game_slug,
        stateRow.state as GameState,
        secretsRow?.payload ?? null,
        member.seat_index
      );
    }
  }

  return NextResponse.json({
    room: {
      id: room.id,
      code: room.code,
      gameSlug: room.game_slug,
      status: room.status,
      hostPlayerId: room.host_player_id,
      gameOptions: (room.game_options as Record<string, unknown> | null) ?? {},
      players: (players ?? []).map((p) => ({
        playerId: p.player_id,
        seatIndex: p.seat_index,
        displayName: p.display_name,
      })),
    },
    gameState: stateRow
      ? {
          state: projectedState ?? stateRow.state,
          version: stateRow.version,
          currentPlayer: stateRow.current_player,
        }
      : null,
  });
}
