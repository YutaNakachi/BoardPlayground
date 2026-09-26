import { savePendingJoin } from "@/lib/online/join-room-pending";
import { joinRoom } from "@/lib/online/room-client";
import { isOnlineGame } from "@/lib/online/types";

export type JoinRoomFlowParams = {
  code: string;
  displayName: string;
  navigate: (path: string) => void;
};

export type JoinRoomFlowResult = {
  gameSlug: string;
  code: string;
};

export async function joinRoomFlow(
  params: JoinRoomFlowParams
): Promise<JoinRoomFlowResult> {
  const trimmedName = params.displayName.trim();
  if (!trimmedName) {
    throw new Error("表示名を入力してください");
  }

  const result = await joinRoom(params.code, trimmedName);
  const gameSlug = result.gameSlug;
  if (!gameSlug || !isOnlineGame(gameSlug)) {
    throw new Error("この部屋のゲームに参加できません");
  }

  savePendingJoin(result.code, trimmedName);
  params.navigate(
    `/play/${gameSlug}?room=${encodeURIComponent(result.code)}`
  );
  return { gameSlug, code: result.code };
}

export function playSlugFromPathname(pathname: string): string | null {
  const match = pathname.match(/^\/play\/([^/]+)/);
  return match ? match[1] : null;
}
