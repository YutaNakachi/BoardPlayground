type DbError = { message?: string; code?: string } | null;

/** rooms.game_options 列が未マイグレーションの DB かどうか */
export function isMissingGameOptionsColumn(error: DbError): boolean {
  if (!error) return false;
  const message = error.message?.toLowerCase() ?? "";
  return (
    error.code === "42703" ||
    error.code === "PGRST204" ||
    message.includes("game_options")
  );
}
