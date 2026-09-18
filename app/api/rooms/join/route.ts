import { NextResponse } from "next/server";
import { API_ERROR, apiError } from "@/lib/api/errors";
import { requireOnlineBackend } from "@/lib/api/require-online";

export async function POST(request: Request) {
  const backend = await requireOnlineBackend();
  if (backend instanceof Response) return backend;
  const { db } = backend;

  let body: {
    code?: string;
    displayName?: string;
    playerId?: string;
  };
  try {
    body = await request.json();
  } catch {
    return apiError(API_ERROR.INVALID_JSON, 400);
  }

  const { code, displayName, playerId } = body;
  if (!code || !displayName || !playerId) {
    return apiError(API_ERROR.MISSING_FIELDS, 400);
  }

  const normalizedCode = code.trim().toUpperCase();

  const { data: room } = await db
    .from("rooms")
    .select("id, code, game_slug, status, host_player_id, expires_at")
    .eq("code", normalizedCode)
    .maybeSingle();

  if (!room) {
    return NextResponse.json({ error: "部屋が見つかりません" }, { status: 404 });
  }

  if (new Date(room.expires_at) < new Date()) {
    return NextResponse.json({ error: "部屋の有効期限が切れています" }, { status: 410 });
  }

  const { data: existingPlayers } = await db
    .from("room_players")
    .select("player_id, seat_index, display_name")
    .eq("room_id", room.id)
    .order("seat_index");

  const alreadyJoined = existingPlayers?.some((p) => p.player_id === playerId);
  let seatIndex = existingPlayers?.find((p) => p.player_id === playerId)?.seat_index ?? -1;

  if (!alreadyJoined) {
    if (room.status !== "waiting") {
      return NextResponse.json({ error: "ゲームは既に開始されています" }, { status: 409 });
    }
    if ((existingPlayers?.length ?? 0) >= 2) {
      return NextResponse.json({ error: "部屋が満員です" }, { status: 409 });
    }
    seatIndex = 1;
    const { error } = await db.from("room_players").insert({
      room_id: room.id,
      player_id: playerId,
      seat_index: seatIndex,
      display_name: displayName.slice(0, 20),
    });
    if (error) {
      return NextResponse.json({ error: "参加に失敗しました" }, { status: 500 });
    }
  }

  const { data: players } = await db
    .from("room_players")
    .select("player_id, seat_index, display_name")
    .eq("room_id", room.id)
    .order("seat_index");

  return NextResponse.json({
    roomId: room.id,
    code: room.code,
    playerId,
    seatIndex,
    status: room.status,
    gameSlug: room.game_slug,
    hostPlayerId: room.host_player_id,
    players: (players ?? []).map((p) => ({
      playerId: p.player_id,
      seatIndex: p.seat_index,
      displayName: p.display_name,
    })),
  });
}
