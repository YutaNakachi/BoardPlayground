import { NextResponse } from "next/server";
import { API_ERROR, apiError } from "@/lib/api/errors";
import { requireOnlineBackend } from "@/lib/api/require-online";
import {
  initialCurrentPlayerSeat,
  mergeGameOptions,
} from "@/lib/online/game-options";
import { kingRoleSeatFromHost, parseHostStartsAsKing } from "@/lib/play/king-and-spy/game-options";
import {
  initialKingAndSpyPublicState,
  initialKingAndSpySecrets,
} from "@/lib/play/king-and-spy/state";
import { createInitialState } from "@/lib/online/moves";
import {
  probeRoomSecretsTable,
  roomSecretsWriteErrorMessage,
  saveRoomSecrets,
} from "@/lib/online/room-secrets";
import { isMissingGameOptionsColumn } from "@/lib/online/room-schema";
import { isOnlineSecretGame } from "@/lib/online/secret-games";
import { isOnlineGame } from "@/lib/online/types";
import { parseOpeningSeat } from "@/lib/online/player-count";
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
    .select("id, game_slug, status, host_player_id, game_options, max_players")
    .eq("id", id)
    .maybeSingle();

  let room = roomSelectWithOptions.data;
  if (roomSelectWithOptions.error && isMissingGameOptionsColumn(roomSelectWithOptions.error)) {
    const roomSelectBase = await db
      .from("rooms")
      .select("id, game_slug, status, host_player_id, max_players")
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

  const maxPlayers = room.max_players ?? 2;
  if ((count ?? 0) !== maxPlayers) {
    return NextResponse.json(
      { error: "目標人数が揃っていません" },
      { status: 409 }
    );
  }

  if (isOnlineSecretGame(room.game_slug)) {
    const secretsReady = await probeRoomSecretsTable(db);
    if (!secretsReady.ok) {
      return NextResponse.json(
        { error: secretsReady.message, code: secretsReady.code },
        { status: 503 }
      );
    }
  }

  if (!isOnlineGame(room.game_slug)) {
    return NextResponse.json({ error: "Unsupported game" }, { status: 400 });
  }

  const optionPatch: Record<string, unknown> = { ...(requestedOptions ?? {}) };
  if (requestedFirstPlayer !== undefined) {
    optionPatch.firstPlayer = requestedFirstPlayer;
  }
  const gameOptions = mergeGameOptions(room.game_slug, room.game_options, optionPatch);

  if (gameOptions === null) {
    return NextResponse.json({ error: "Invalid game options" }, { status: 400 });
  }

  const { data: seatPlayers } = await db
    .from("room_players")
    .select("player_id, seat_index")
    .eq("room_id", id);

  let gameOptionsToStore = gameOptions;
  let secretsPayload: unknown | null = null;
  let initialState: ReturnType<typeof createInitialState>;

  if (room.game_slug === "king-and-spy") {
    const hostSeat =
      (seatPlayers ?? []).find((p) => p.player_id === room.host_player_id)
        ?.seat_index ?? 0;
    const kingRoleSeat = kingRoleSeatFromHost(
      hostSeat as 0 | 1,
      parseHostStartsAsKing(gameOptions)
    );
    gameOptionsToStore = { ...gameOptions, kingRoleSeat };
    initialState = initialKingAndSpyPublicState(kingRoleSeat);
    secretsPayload = initialKingAndSpySecrets(kingRoleSeat);
  } else {
    const openingFromOptions = parseOpeningSeat(gameOptions, maxPlayers);
    if (openingFromOptions === null) {
      return NextResponse.json({ error: "Invalid firstPlayer" }, { status: 400 });
    }
    initialState = createInitialState(room.game_slug, gameOptions);
  }

  const openingSeat =
    room.game_slug === "king-and-spy"
      ? null
      : initialCurrentPlayerSeat(room.game_slug, gameOptions);

  const { data: existingState } = await db
    .from("room_state")
    .select("room_id")
    .eq("room_id", id)
    .maybeSingle();

  const statePayload = {
    state: initialState,
    version: 1,
    current_player: openingSeat,
    updated_at: new Date().toISOString(),
  };

  const { error: stateError } = existingState
    ? await db.from("room_state").update(statePayload).eq("room_id", id)
    : await db.from("room_state").insert({ room_id: id, ...statePayload });

  if (stateError) {
    console.error("[rooms/start] room_state", stateError.message);
    return NextResponse.json(
      { error: "ゲーム状態の保存に失敗しました" },
      { status: 500 }
    );
  }

  if (isOnlineSecretGame(room.game_slug) && secretsPayload) {
    try {
      await saveRoomSecrets(db, id, secretsPayload, 1);
    } catch (e) {
      console.error("[rooms/start] secrets", e);
      return NextResponse.json(
        {
          error: roomSecretsWriteErrorMessage(e),
          code: "ROOM_SECRETS_WRITE_FAILED",
        },
        { status: 500 }
      );
    }
  }

  await db
    .from("rooms")
    .update({ status: "playing", game_options: gameOptionsToStore })
    .eq("id", id);
  const countResult = await incrementPlayCount(db, room.game_slug);
  if (!countResult.ok) {
    console.error("[rooms/start] stats", countResult.message);
  }

  return NextResponse.json({ ok: true });
}
