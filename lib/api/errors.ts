export const API_ERROR = {
  ONLINE_NOT_CONFIGURED: "オンライン対戦は現在利用できません（サーバー設定を確認してください）",
  STATS_NOT_CONFIGURED: "プレイ回数の記録は現在利用できません",
  DB_UNAVAILABLE: "データベースに接続できません。Supabase のマイグレーションを実行してください",
  INVALID_JSON: "リクエストが不正です",
  MISSING_FIELDS: "必須項目が不足しています",
  ROOM_NOT_FOUND: "部屋が見つかりません",
  ROOM_EXPIRED: "部屋の有効期限が切れています",
  WRONG_PASSPHRASE: "合言葉が正しくありません",
  ROOM_FULL: "部屋が満員です",
  GAME_ALREADY_STARTED: "ゲームは既に開始されています",
  HOST_ONLY: "ホストのみ開始できます",
  NOT_ENOUGH_PLAYERS: "参加者が2人揃っていません",
  NOT_YOUR_TURN: "あなたの手番ではありません",
  ILLEGAL_MOVE: "その手はできません",
  UNKNOWN_GAME: "ゲームが見つかりません",
  CREATE_ROOM_FAILED: "部屋の作成に失敗しました",
  JOIN_ROOM_FAILED: "部屋への参加に失敗しました",
  START_GAME_FAILED: "ゲームの開始に失敗しました",
  MOVE_FAILED: "手の送信に失敗しました",
} as const;

export function apiError(message: string, status: number) {
  return Response.json({ error: message }, { status });
}
