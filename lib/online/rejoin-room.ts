export type JoinFollowUp = "enter-room" | "redirect" | "stay-on-form";

/**
 * join が成功したあとの画面。対局中・終局後でも同じ席なら部屋へ入る。
 * 参加フォームへ戻すのは席が取れないときだけ。
 */
export function followUpAfterJoin(params: {
  pageSlug: string;
  joinedSlug: string | null | undefined;
  seatIndex: number;
  status: string;
}): JoinFollowUp {
  if (!params.joinedSlug) return "stay-on-form";
  if (params.seatIndex < 0) return "stay-on-form";
  if (
    params.status !== "waiting" &&
    params.status !== "playing" &&
    params.status !== "finished"
  ) {
    return "stay-on-form";
  }
  if (params.joinedSlug !== params.pageSlug) return "redirect";
  return "enter-room";
}

/** ?room= があり、名前が分かっていて、まだ部屋状態が無いときだけ自動復帰する。 */
export function shouldResumeFromRoomUrl(params: {
  roomCode: string | null;
  phase: string;
  hasRoom: boolean;
  displayName: string | null;
}): boolean {
  return Boolean(
    params.roomCode &&
      params.roomCode.length >= 6 &&
      params.phase === "idle" &&
      !params.hasRoom &&
      params.displayName
  );
}
