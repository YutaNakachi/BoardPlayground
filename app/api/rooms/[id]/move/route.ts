import { NextResponse } from "next/server";
import { requireOnlineBackend } from "@/lib/api/require-online";
import { applyMove, type MovePayload } from "@/lib/online/moves";
import { stateConflictPayload } from "@/lib/online/move-sync";
import { applyOnlineMoveWithSecrets } from "@/lib/online/secret-move";
import { isOnlineSecretGame } from "@/lib/online/secret-games";
import { isOnlineGame } from "@/lib/online/types";

function conflictResponse(row: {
  state: unknown;
  version: number;
  current_player: number | null;
}) {
  return NextResponse.json(
    stateConflictPayload(row.version, row.state, row.current_player),
    { status: 409, headers: { "Cache-Control": "no-store" } }
  );
}

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

  const secretGame = isOnlineSecretGame(room.game_slug);

  if (
    !secretGame &&
    expectedVersion != null &&
    stateRow.version !== expectedVersion
  ) {
    return conflictResponse(stateRow);
  }

  const baseState = stateRow.state as import("@/lib/online/moves").GameState;

  let publicState: import("@/lib/online/moves").GameState;
  let responseState: import("@/lib/online/moves").GameState;
  let newVersion: number;
  let currentPlayer: number | null;
  let newStatus: "playing" | "finished";

  if (secretGame) {
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
      const status = secretResult.error === "State conflict" ? 409 : 400;
      return NextResponse.json({ error: secretResult.error }, { status });
    }
    if (secretResult.finished) {
      await db.from("rooms").update({ status: "finished" }).eq("id", id);
    }
    return NextResponse.json({
      gameState: {
        state: secretResult.projectedState,
        version: secretResult.newVersion,
        currentPlayer: secretResult.currentPlayer,
      },
    });
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

  const { data: updated, error: updateError } = await db
    .from("room_state")
    .update({
      state: publicState,
      version: newVersion,
      current_player: currentPlayer,
      updated_at: new Date().toISOString(),
    })
    .eq("room_id", id)
    .eq("version", stateRow.version)
    .select("state, version, current_player")
    .maybeSingle();

  if (updateError) {
    console.error("[rooms/move]", updateError.message);
    return NextResponse.json({ error: "手の保存に失敗しました" }, { status: 500 });
  }

  if (!updated) {
    const { data: latest } = await db
      .from("room_state")
      .select("state, version, current_player")
      .eq("room_id", id)
      .maybeSingle();
    if (!latest) {
      return NextResponse.json({ error: "Game state not found" }, { status: 404 });
    }
    return conflictResponse(latest);
  }

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
