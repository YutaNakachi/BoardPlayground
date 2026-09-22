import { NextResponse } from "next/server";
import { API_ERROR, apiError } from "@/lib/api/errors";
import { requireOnlineBackend } from "@/lib/api/require-online";
import { isValidPlayerId } from "@/lib/online/player-id";
import { isMissingGameOptionsColumn } from "@/lib/online/room-schema";

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
  if (!isValidPlayerId(playerId)) {
    return NextResponse.json({ error: "プレイヤー ID が不正です。ページを再読み込みしてください。" }, { status: 400 });
  }

  const normalizedCode = code.trim().toUpperCase();

  const roomSelectWithOptions = await db
    .from("rooms")
    .select("id, code, game_slug, status, host_player_id, expires_at, game_options")
    .eq("code", normalizedCode)
    .maybeSingle();

  let room = roomSelectWithOptions.data;
  if (roomSelectWithOptions.error && isMissingGameOptionsColumn(roomSelectWithOptions.error)) {
    const roomSelectBase = await db
      .from("rooms")
      .select("id, code, game_slug, status, host_player_id, expires_at")
      .eq("code", normalizedCode)
      .maybeSingle();
    room = roomSelectBase.data
      ? { ...roomSelectBase.data, game_options: {} }
      : null;
  } else if (roomSelectWithOptions.error) {
    console.error("[rooms/join]", roomSelectWithOptions.error.message);
    return NextResponse.json({ error: "部屋情報の取得に失敗しました" }, { status: 500 });
  }

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
    gameOptions: (room.game_options as Record<string, unknown> | null) ?? {},
    players: (players ?? []).map((p) => ({
      playerId: p.player_id,
      seatIndex: p.seat_index,
      displayName: p.display_name,
    })),
  });
}
