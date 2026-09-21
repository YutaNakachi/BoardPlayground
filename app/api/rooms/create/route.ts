import { NextResponse } from "next/server";
import { API_ERROR, apiError } from "@/lib/api/errors";
import { requireOnlineBackend } from "@/lib/api/require-online";
import { getGameBySlug } from "@/lib/games";
import { ROOM_PASSPHRASE_PLACEHOLDER } from "@/lib/online/room-auth";
import { validateGameOptions } from "@/lib/online/game-options";
import { generateRoomCode } from "@/lib/online/room-code";
import { isOnlineGame, type OnlineGameSlug } from "@/lib/online/types";

export async function POST(request: Request) {
  const backend = await requireOnlineBackend();
  if (backend instanceof Response) return backend;
  const { db } = backend;

  let body: {
    gameSlug?: string;
    displayName?: string;
    playerId?: string;
    gameOptions?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return apiError(API_ERROR.INVALID_JSON, 400);
  }

  const { gameSlug, displayName, playerId, gameOptions } = body;
  if (!gameSlug || !displayName || !playerId) {
    return apiError(API_ERROR.MISSING_FIELDS, 400);
  }

  if (!isOnlineGame(gameSlug)) {
    return NextResponse.json({ error: "Game does not support online play" }, { status: 400 });
  }

  const validatedOptions = validateGameOptions(gameSlug as OnlineGameSlug, gameOptions);
  if (validatedOptions === null) {
    return NextResponse.json({ error: "Invalid game options" }, { status: 400 });
  }

  const game = getGameBySlug(gameSlug);
  if (!game || game.status !== "playable") {
    return NextResponse.json({ error: "Unknown game" }, { status: 404 });
  }

  let code = generateRoomCode();
  let attempts = 0;

  while (attempts < 5) {
    const { data: existing } = await db
      .from("rooms")
      .select("id")
      .eq("code", code)
      .maybeSingle();
    if (!existing) break;
    code = generateRoomCode();
    attempts++;
  }

  const { data: room, error: roomError } = await db
    .from("rooms")
    .insert({
      code,
      game_slug: gameSlug,
      passphrase_hash: ROOM_PASSPHRASE_PLACEHOLDER,
      status: "waiting",
      host_player_id: playerId,
      game_options: validatedOptions,
    })
    .select("id, code")
    .single();

  if (roomError || !room) {
    console.error("[rooms/create]", roomError?.message);
    return apiError(API_ERROR.CREATE_ROOM_FAILED, 500);
  }

  const { error: playerError } = await db.from("room_players").insert({
    room_id: room.id,
    player_id: playerId,
    seat_index: 0,
    display_name: displayName.slice(0, 20),
  });

  if (playerError) {
    await db.from("rooms").delete().eq("id", room.id);
    return apiError(API_ERROR.JOIN_ROOM_FAILED, 500);
  }

  return NextResponse.json({
    roomId: room.id,
    code: room.code,
    playerId,
    seatIndex: 0,
  });
}
