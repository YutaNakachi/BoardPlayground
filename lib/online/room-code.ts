const CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** 部屋コード入力欄用。全角英数字を半角にし、英数字のみ 6 文字まで残す。 */
export function normalizeRoomCodeInput(raw: string): string {
  const halfWidth = raw.replace(/[Ａ-Ｚａ-ｚ０-９]/g, (char) =>
    String.fromCharCode(char.charCodeAt(0) - 0xfee0)
  );
  return halfWidth.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
}

export function generateRoomCode(length = 6): string {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += CHARSET[Math.floor(Math.random() * CHARSET.length)];
  }
  return code;
}
