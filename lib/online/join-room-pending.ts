import { normalizeRoomCodeInput } from "@/lib/online/room-code";

const STORAGE_KEY = "bp_pending_join";

export type PendingJoinSession = {
  roomId: string;
  playerId: string;
  seatIndex: number;
};

export type PendingJoin = {
  code: string;
  displayName: string;
  session?: PendingJoinSession;
};

export function savePendingJoin(
  code: string,
  displayName: string,
  session?: PendingJoinSession
): void {
  if (typeof sessionStorage === "undefined") return;
  const payload: PendingJoin = {
    code,
    displayName: displayName.slice(0, 20),
    ...(session ? { session } : {}),
  };
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
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

const LAST_NAME_KEY = "bp_last_display_name";

function readStoredName(storage: Storage | undefined): string | null {
  if (!storage) return null;
  try {
    const name = storage.getItem(LAST_NAME_KEY);
    return name && name.trim() ? name : null;
  } catch {
    return null;
  }
}

export function saveLastDisplayName(displayName: string): void {
  const trimmed = displayName.trim().slice(0, 20);
  if (!trimmed) return;
  try {
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.setItem(LAST_NAME_KEY, trimmed);
    }
  } catch {
    // プライベートモードなどでは保存しない
  }
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(LAST_NAME_KEY, trimmed);
    }
  } catch {
    // 別タブの ?room= 復帰に使えなくても、同じタブでは sessionStorage で足りる
  }
}

export function readLastDisplayName(): string | null {
  const session =
    typeof sessionStorage !== "undefined" ? sessionStorage : undefined;
  const local = typeof localStorage !== "undefined" ? localStorage : undefined;
  return readStoredName(session) ?? readStoredName(local);
}

export function pendingJoinMatchesUrlCode(
  joinCodeFromUrl: string | null
): PendingJoin | null {
  if (!joinCodeFromUrl) return null;
  const pending = readPendingJoin();
  if (!pending) return null;
  const normalized = normalizeRoomCodeInput(joinCodeFromUrl);
  const pendingCode = normalizeRoomCodeInput(pending.code);
  if (normalized.length < 6 || pendingCode !== normalized) return null;
  return pending;
}
