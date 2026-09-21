import { NextResponse } from "next/server";
import { requireOnlineBackend } from "@/lib/api/require-online";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const backend = await requireOnlineBackend();
  if (backend instanceof Response) return backend;
  const { db } = backend;

  const { id } = await params;

  const { data: room } = await db
    .from("rooms")
    .select("id, code, game_slug, status, host_player_id, expires_at, game_options")
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
      gameOptions: (room.game_options as Record<string, unknown> | null) ?? {},
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
