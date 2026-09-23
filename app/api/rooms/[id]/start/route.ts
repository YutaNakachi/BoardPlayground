import { NextResponse } from "next/server";
import { API_ERROR, apiError } from "@/lib/api/errors";
import { requireOnlineBackend } from "@/lib/api/require-online";
import { mergeGameOptions, parseFirstPlayer } from "@/lib/online/game-options";
import { createInitialState } from "@/lib/online/moves";
import { isMissingGameOptionsColumn } from "@/lib/online/room-schema";
import { isOnlineGame } from "@/lib/online/types";
import { incrementPlayCount } from "@/lib/stats/record-play";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const backend = await requireOnlineBackend();
  if (backend instanceof Response) return backend;
  const { db } = backend;

  const { id } = await params;

  let body: {
    playerId?: string;
    firstPlayer?: number;
    gameOptions?: Record<string, unknown>;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { playerId, firstPlayer: requestedFirstPlayer, gameOptions: requestedOptions } =
    body;
  if (!playerId) {
    return NextResponse.json({ error: "playerId is required" }, { status: 400 });
  }

  const roomSelectWithOptions = await db
    .from("rooms")
    .select("id, game_slug, status, host_player_id, game_options")
    .eq("id", id)
    .maybeSingle();

  let room = roomSelectWithOptions.data;
  if (roomSelectWithOptions.error && isMissingGameOptionsColumn(roomSelectWithOptions.error)) {
    const roomSelectBase = await db
      .from("rooms")
      .select("id, game_slug, status, host_player_id")
      .eq("id", id)
      .maybeSingle();
    room = roomSelectBase.data
      ? { ...roomSelectBase.data, game_options: {} }
      : null;
  } else if (roomSelectWithOptions.error) {
    console.error("[rooms/start]", roomSelectWithOptions.error.message);
    return NextResponse.json({ error: "部屋情報の取得に失敗しました" }, { status: 500 });
  }

  if (!room) {
    return NextResponse.json({ error: "部屋が見つかりません" }, { status: 404 });
  }

  if (room.host_player_id !== playerId) {
    return NextResponse.json({ error: "ホストのみ開始できます" }, { status: 403 });
  }

  if (room.status !== "waiting" && room.status !== "finished") {
    return NextResponse.json({ error: "既に開始されています" }, { status: 409 });
  }

  const { count } = await db
    .from("room_players")
    .select("*", { count: "exact", head: true })
    .eq("room_id", id);

  if ((count ?? 0) < 2) {
    return NextResponse.json({ error: "参加者が2人揃っていません" }, { status: 409 });
  }

  if (!isOnlineGame(room.game_slug)) {
    return NextResponse.json({ error: "Unsupported game" }, { status: 400 });
  }

  if (
    requestedFirstPlayer !== undefined &&
    requestedFirstPlayer !== 0 &&
    requestedFirstPlayer !== 1
  ) {
    return NextResponse.json({ error: "Invalid firstPlayer" }, { status: 400 });
  }

  const optionPatch: Record<string, unknown> = { ...(requestedOptions ?? {}) };
  if (requestedFirstPlayer !== undefined) {
    optionPatch.firstPlayer = requestedFirstPlayer;
  }
  const gameOptions = mergeGameOptions(room.game_slug, room.game_options, optionPatch);

  if (gameOptions === null) {
    return NextResponse.json({ error: "Invalid game options" }, { status: 400 });
  }

  const firstPlayer = parseFirstPlayer(gameOptions);
  const initialState = createInitialState(room.game_slug, gameOptions);

  const { data: existingState } = await db
    .from("room_state")
    .select("room_id")
    .eq("room_id", id)
    .maybeSingle();

  const statePayload = {
    state: initialState,
    version: 1,
    current_player: firstPlayer,
    updated_at: new Date().toISOString(),
  };

  const { error: stateError } = existingState
    ? await db.from("room_state").update(statePayload).eq("room_id", id)
    : await db.from("room_state").insert({ room_id: id, ...statePayload });

  if (stateError) {
    return NextResponse.json({ error: "Failed to start game" }, { status: 500 });
  }

  await db
    .from("rooms")
    .update({ status: "playing", game_options: gameOptions })
    .eq("id", id);
  const countResult = await incrementPlayCount(db, room.game_slug);
  if (!countResult.ok) {
    console.error("[rooms/start] stats", countResult.message);
  }

  return NextResponse.json({ ok: true });
}
