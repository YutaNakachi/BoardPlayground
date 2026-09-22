import { NextResponse } from "next/server";
import { API_ERROR, apiError } from "@/lib/api/errors";
import { requireOnlineBackend } from "@/lib/api/require-online";
import { createInitialState } from "@/lib/online/moves";
import { isOnlineGame } from "@/lib/online/types";
import { incrementPlayCount } from "@/lib/stats/record-play";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const backend = await requireOnlineBackend();
  if (backend instanceof Response) return backend;
  const { db } = backend;

  const { id } = await params;

  let body: { playerId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { playerId } = body;
  if (!playerId) {
    return NextResponse.json({ error: "playerId is required" }, { status: 400 });
  }

  const { data: room } = await db
    .from("rooms")
    .select("id, game_slug, status, host_player_id")
    .eq("id", id)
    .maybeSingle();

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

  const initialState = createInitialState(room.game_slug);

  const { data: existingState } = await db
    .from("room_state")
    .select("room_id")
    .eq("room_id", id)
    .maybeSingle();

  const statePayload = {
    state: initialState,
    version: 1,
    current_player: 0,
    updated_at: new Date().toISOString(),
  };

  const { error: stateError } = existingState
    ? await db.from("room_state").update(statePayload).eq("room_id", id)
    : await db.from("room_state").insert({ room_id: id, ...statePayload });

  if (stateError) {
    return NextResponse.json({ error: "Failed to start game" }, { status: 500 });
  }

  await db.from("rooms").update({ status: "playing" }).eq("id", id);
  const countResult = await incrementPlayCount(db, room.game_slug);
  if (!countResult.ok) {
    console.error("[rooms/start] stats", countResult.message);
  }

  return NextResponse.json({ ok: true });
}
