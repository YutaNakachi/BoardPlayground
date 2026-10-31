import { NextResponse } from "next/server";
import { requireOnlineBackend } from "@/lib/api/require-online";
import type { GameState } from "@/lib/online/moves";
import { projectGameStateForSeat } from "@/lib/online/project-state";
import { isTransientDbError, rosterFromQuery } from "@/lib/online/room-read";
import { loadRoomSecrets } from "@/lib/online/room-secrets";
import { isMissingGameOptionsColumn } from "@/lib/online/room-schema";
import { isOnlineSecretGame } from "@/lib/online/secret-games";

type QueryError = { message?: string; code?: string } | null;

async function readQuery<T>(
  query: () => PromiseLike<{ data: T; error: QueryError }>
): Promise<{ data: T | null; error: QueryError }> {
  try {
    const first = await query();
    if (first.error && isTransientDbError(first.error)) {
      try {
        return await query();
      } catch (e) {
        const message = e instanceof Error ? e.message : "部屋情報の取得に失敗しました";
        return { data: null, error: { message } };
      }
    }
    return first;
  } catch (e) {
    try {
      return await query();
    } catch (retryError) {
      const message =
        retryError instanceof Error
          ? retryError.message
          : e instanceof Error
            ? e.message
            : "部屋情報の取得に失敗しました";
      return { data: null, error: { message } };
    }
  }
}

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
  const backend = await requireOnlineBackend();
  if (backend instanceof Response) return backend;
  const { db } = backend;

  const { id } = await params;

  const roomSelectWithOptions = await readQuery(() =>
    db
      .from("rooms")
      .select(
        "id, code, game_slug, status, host_player_id, expires_at, game_options, max_players"
      )
      .eq("id", id)
      .maybeSingle()
  );

  let room = roomSelectWithOptions.data;
  if (roomSelectWithOptions.error && isMissingGameOptionsColumn(roomSelectWithOptions.error)) {
    const roomSelectBase = await db
      .from("rooms")
      .select(
        "id, code, game_slug, status, host_player_id, expires_at, max_players"
      )
      .eq("id", id)
      .maybeSingle();
    room = roomSelectBase.data
      ? {
          ...roomSelectBase.data,
          game_options: {},
          max_players: roomSelectBase.data.max_players ?? 2,
        }
      : null;
  } else if (roomSelectWithOptions.error) {
    console.error("[rooms/get]", roomSelectWithOptions.error.message);
    const status = isTransientDbError(roomSelectWithOptions.error) ? 503 : 500;
    return NextResponse.json({ error: "部屋情報の取得に失敗しました" }, { status });
  }

  if (!room) {
    return NextResponse.json({ error: "部屋が見つかりません" }, { status: 404 });
  }

  if (new Date(room.expires_at) < new Date()) {
    return NextResponse.json({ error: "部屋の有効期限が切れています" }, { status: 410 });
  }

  const playersResult = await readQuery(() =>
    db
      .from("room_players")
      .select("player_id, seat_index, display_name")
      .eq("room_id", id)
      .order("seat_index")
  );
  const roster = rosterFromQuery(
    playersResult.data,
    playersResult.error != null
  );
  if (!roster) {
    console.error("[rooms/get] players", playersResult.error?.message);
    return NextResponse.json(
      { error: "部屋情報の取得に失敗しました" },
      { status: 503 }
    );
  }

  const stateResult = await readQuery(() =>
    db
      .from("room_state")
      .select("state, version, current_player")
      .eq("room_id", id)
      .maybeSingle()
  );
  if (stateResult.error) {
    console.error("[rooms/get] state", stateResult.error.message);
    return NextResponse.json(
      { error: "部屋情報の取得に失敗しました" },
      { status: isTransientDbError(stateResult.error) ? 503 : 500 }
    );
  }
  const stateRow = stateResult.data;

  const playerId = new URL(request.url).searchParams.get("playerId");
  let projectedState: GameState | null = stateRow
    ? (stateRow.state as GameState)
    : null;

  if (
    stateRow &&
    (room.status === "playing" || room.status === "finished") &&
    isOnlineSecretGame(room.game_slug) &&
    playerId
  ) {
    const member = (playersResult.data ?? []).find(
      (p) => p.player_id === playerId
    );
    if (member) {
      let secretsRow: Awaited<ReturnType<typeof loadRoomSecrets>> = null;
      try {
        secretsRow = await loadRoomSecrets(db, id);
      } catch (e) {
        console.error("[rooms/get] secrets", e);
        return NextResponse.json(
          { error: "部屋情報の取得に失敗しました" },
          { status: 503 }
        );
      }
      projectedState = projectGameStateForSeat(
        room.game_slug,
        stateRow.state as GameState,
        secretsRow?.payload ?? null,
        member.seat_index
      );
    }
  }

  return NextResponse.json({
    room: {
      id: room.id,
      code: room.code,
      gameSlug: room.game_slug,
      status: room.status,
      hostPlayerId: room.host_player_id,
      maxPlayers: room.max_players ?? 2,
      gameOptions: (room.game_options as Record<string, unknown> | null) ?? {},
      players: roster,
    },
    gameState: stateRow
      ? {
          state: projectedState ?? stateRow.state,
          version: stateRow.version,
          currentPlayer: stateRow.current_player,
        }
      : null,
  }, {
    headers: { "Cache-Control": "no-store" },
  });
}
