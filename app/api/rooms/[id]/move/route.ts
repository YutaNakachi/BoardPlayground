import { NextResponse } from "next/server";
import { requireOnlineBackend } from "@/lib/api/require-online";
import { applyMove, type MovePayload } from "@/lib/online/moves";
import { applyOnlineMoveWithSecrets } from "@/lib/online/secret-move";
import { isOnlineSecretGame } from "@/lib/online/secret-games";
import { isOnlineGame } from "@/lib/online/types";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const backend = await requireOnlineBackend();
  if (backend instanceof Response) return backend;
  const { db } = backend;

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
    .select("id, game_slug, status, game_options")
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

  const baseState = stateRow.state as import("@/lib/online/moves").GameState;

  let publicState: import("@/lib/online/moves").GameState;
  let responseState: import("@/lib/online/moves").GameState;
  let newVersion: number;
  let currentPlayer: number | null;
  let newStatus: "playing" | "finished";

  if (isOnlineSecretGame(room.game_slug)) {
    const secretResult = await applyOnlineMoveWithSecrets(
      db,
      id,
      room.game_slug,
      baseState,
      stateRow.version,
      player.seat_index,
      move
    );
    if ("error" in secretResult) {
      return NextResponse.json({ error: secretResult.error }, { status: 400 });
    }
    publicState = secretResult.publicState;
    responseState = secretResult.projectedState;
    newVersion = secretResult.newVersion;
    currentPlayer = secretResult.currentPlayer;
    newStatus = secretResult.finished ? "finished" : "playing";
  } else {
    const result = applyMove(
      room.game_slug,
      baseState,
      player.seat_index,
      move,
      room.game_options ?? undefined
    );

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    publicState = result.state;
    responseState = result.state;
    newVersion = stateRow.version + 1;
    currentPlayer = result.currentPlayer;
    newStatus = result.state.phase === "game-over" ? "finished" : "playing";
  }

  await db
    .from("room_state")
    .update({
      state: publicState,
      version: newVersion,
      current_player: currentPlayer,
      updated_at: new Date().toISOString(),
    })
    .eq("room_id", id);

  if (newStatus === "finished") {
    await db.from("rooms").update({ status: "finished" }).eq("id", id);
  }

  return NextResponse.json({
    gameState: {
      state: responseState,
      version: newVersion,
      currentPlayer,
    },
  });
}
