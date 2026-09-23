import { NextResponse } from "next/server";
import { requireOnlineBackend } from "@/lib/api/require-online";
import { mergeGameOptions } from "@/lib/online/game-options";
import { isMissingGameOptionsColumn } from "@/lib/online/room-schema";
import { isOnlineGame } from "@/lib/online/types";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const backend = await requireOnlineBackend();
  if (backend instanceof Response) return backend;
  const { db } = backend;

  const { id } = await params;

  let body: { playerId?: string; gameOptions?: Record<string, unknown> };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { playerId, gameOptions } = body;
  if (!playerId || !gameOptions) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const roomSelectWithOptions = await db
    .from("rooms")
    .select("id, game_slug, status, host_player_id, game_options")
    .eq("id", id)
    .maybeSingle();

  let room = roomSelectWithOptions.data;
  if (roomSelectWithOptions.error && isMissingGameOptionsColumn(roomSelectWithOptions.error)) {
    return NextResponse.json(
      { error: "モード選択を保存できません。データベースのマイグレーションが未適用です。" },
      { status: 503 }
    );
  }
  if (roomSelectWithOptions.error) {
    console.error("[rooms/options]", roomSelectWithOptions.error.message);
    return NextResponse.json({ error: "部屋情報の取得に失敗しました" }, { status: 500 });
  }

  if (!room) {
    return NextResponse.json({ error: "部屋が見つかりません" }, { status: 404 });
  }

  if (room.host_player_id !== playerId) {
    return NextResponse.json({ error: "ホストのみ変更できます" }, { status: 403 });
  }

  if (room.status !== "waiting" && room.status !== "finished") {
    return NextResponse.json(
      { error: "待機中または終局後のみ変更できます" },
      { status: 409 }
    );
  }

  if (!isOnlineGame(room.game_slug)) {
    return NextResponse.json({ error: "Unsupported game" }, { status: 400 });
  }

  const merged = mergeGameOptions(room.game_slug, room.game_options, gameOptions);
  if (merged === null) {
    return NextResponse.json({ error: "Invalid game options" }, { status: 400 });
  }

  const { error } = await db
    .from("rooms")
    .update({ game_options: merged })
    .eq("id", id);

  if (error) {
    console.error("[rooms/options]", error.message);
    return NextResponse.json({ error: "設定の保存に失敗しました" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, gameOptions: merged });
}
