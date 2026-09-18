import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Online play is not configured" }, { status: 503 });
  }

  const db = getSupabaseAdmin();
  if (!db) {
    return NextResponse.json({ error: "Online play is not configured" }, { status: 503 });
  }

  let body: {
    code?: string;
    passphrase?: string;
    displayName?: string;
    playerId?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { code, passphrase, displayName, playerId } = body;
  if (!code || !passphrase || !displayName || !playerId) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const normalizedCode = code.trim().toUpperCase();

  const { data: room } = await db
    .from("rooms")
    .select("id, code, game_slug, status, passphrase_hash, host_player_id, expires_at")
    .eq("code", normalizedCode)
    .maybeSingle();

  if (!room) {
    return NextResponse.json({ error: "部屋が見つかりません" }, { status: 404 });
  }

  if (new Date(room.expires_at) < new Date()) {
    return NextResponse.json({ error: "部屋の有効期限が切れています" }, { status: 410 });
  }

  const valid = await bcrypt.compare(passphrase, room.passphrase_hash);
  if (!valid) {
    return NextResponse.json({ error: "合言葉が正しくありません" }, { status: 403 });
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
