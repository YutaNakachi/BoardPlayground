const STORAGE_KEY = "bp_pending_join";

export type PendingJoin = {
  code: string;
  displayName: string;
};

export function savePendingJoin(code: string, displayName: string): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ code, displayName: displayName.slice(0, 20) })
  );
}

export function readPendingJoin(): PendingJoin | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PendingJoin;
    if (!parsed.code || !parsed.displayName) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearPendingJoin(): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.removeItem(STORAGE_KEY);
}
