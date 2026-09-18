import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Online play is not configured" }, { status: 503 });
  }

  const db = getSupabaseAdmin();
  if (!db) {
    return NextResponse.json({ error: "Online play is not configured" }, { status: 503 });
  }

  const { id } = await params;

  const { data: room } = await db
    .from("rooms")
    .select("id, code, game_slug, status, host_player_id, expires_at")
    .eq("id", id)
    .maybeSingle();

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

  return NextResponse.json({
    room: {
      id: room.id,
      code: room.code,
      gameSlug: room.game_slug,
      status: room.status,
      hostPlayerId: room.host_player_id,
      players: (players ?? []).map((p) => ({
        playerId: p.player_id,
        seatIndex: p.seat_index,
        displayName: p.display_name,
      })),
    },
    gameState: stateRow
      ? {
          state: stateRow.state,
          version: stateRow.version,
          currentPlayer: stateRow.current_player,
        }
      : null,
  });
}
