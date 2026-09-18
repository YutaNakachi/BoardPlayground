import { NextResponse } from "next/server";
import { applyMove, type MovePayload } from "@/lib/online/moves";
import { isOnlineGame } from "@/lib/online/types";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Online play is not configured" }, { status: 503 });
  }

  const db = getSupabaseAdmin();
  if (!db) {
    return NextResponse.json({ error: "Online play is not configured" }, { status: 503 });
  }

  const { id } = await params;

  let body: {
    playerId?: string;
    move?: MovePayload;
    expectedVersion?: number;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { playerId, move, expectedVersion } = body;
  if (!playerId || !move) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const { data: room } = await db
    .from("rooms")
    .select("id, game_slug, status")
    .eq("id", id)
    .maybeSingle();

  if (!room || room.status !== "playing") {
    return NextResponse.json({ error: "Game is not in progress" }, { status: 409 });
  }

  if (!isOnlineGame(room.game_slug)) {
    return NextResponse.json({ error: "Unsupported game" }, { status: 400 });
  }

  const { data: player } = await db
    .from("room_players")
    .select("seat_index")
    .eq("room_id", id)
    .eq("player_id", playerId)
    .maybeSingle();

  if (!player) {
    return NextResponse.json({ error: "Not a room member" }, { status: 403 });
  }

  const { data: stateRow } = await db
    .from("room_state")
    .select("state, version, current_player")
    .eq("room_id", id)
    .single();

  if (!stateRow) {
    return NextResponse.json({ error: "Game state not found" }, { status: 404 });
  }

  if (expectedVersion != null && stateRow.version !== expectedVersion) {
    return NextResponse.json({ error: "State conflict", version: stateRow.version }, { status: 409 });
  }

  const result = applyMove(
    room.game_slug,
    stateRow.state as import("@/lib/online/moves").GameState,
    player.seat_index,
    move
  );

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const newVersion = stateRow.version + 1;
  const newStatus = result.state.phase === "game-over" ? "finished" : "playing";

  await db
    .from("room_state")
    .update({
      state: result.state,
      version: newVersion,
      current_player: result.currentPlayer,
      updated_at: new Date().toISOString(),
    })
    .eq("room_id", id);

  if (newStatus === "finished") {
    await db.from("rooms").update({ status: "finished" }).eq("id", id);
  }

  return NextResponse.json({
    gameState: {
      state: result.state,
      version: newVersion,
      currentPlayer: result.currentPlayer,
    },
  });
}
