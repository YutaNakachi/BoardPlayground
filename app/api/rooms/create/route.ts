import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { getGameBySlug } from "@/lib/games";
import { generateRoomCode } from "@/lib/online/room-code";
import { isOnlineGame } from "@/lib/online/types";
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
    gameSlug?: string;
    passphrase?: string;
    displayName?: string;
    playerId?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { gameSlug, passphrase, displayName, playerId } = body;
  if (!gameSlug || !passphrase || !displayName || !playerId) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (!isOnlineGame(gameSlug)) {
    return NextResponse.json({ error: "Game does not support online play" }, { status: 400 });
  }

  const game = getGameBySlug(gameSlug);
  if (!game || game.status !== "playable") {
    return NextResponse.json({ error: "Unknown game" }, { status: 404 });
  }

  if (passphrase.length < 4) {
    return NextResponse.json({ error: "Passphrase must be at least 4 characters" }, { status: 400 });
  }

  const passphraseHash = await bcrypt.hash(passphrase, 10);
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
      passphrase_hash: passphraseHash,
      status: "waiting",
      host_player_id: playerId,
    })
    .select("id, code")
    .single();

  if (roomError || !room) {
    return NextResponse.json({ error: "Failed to create room" }, { status: 500 });
  }

  const { error: playerError } = await db.from("room_players").insert({
    room_id: room.id,
    player_id: playerId,
    seat_index: 0,
    display_name: displayName.slice(0, 20),
  });

  if (playerError) {
    await db.from("rooms").delete().eq("id", room.id);
    return NextResponse.json({ error: "Failed to join room" }, { status: 500 });
  }

  return NextResponse.json({
    roomId: room.id,
    code: room.code,
    playerId,
    seatIndex: 0,
  });
}
