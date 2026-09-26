const STORAGE_KEY = "bp_join_nav_shield";

export const JOIN_NAV_SHIELD_EVENT = "bp-join-nav-shield";

export function startJoinNavigationShield(gameSlug: string): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.setItem(STORAGE_KEY, gameSlug);
  dispatchShieldChange();
}

export function readJoinNavigationShield(): string | null {
  if (typeof sessionStorage === "undefined") return null;
  return sessionStorage.getItem(STORAGE_KEY);
}

export function clearJoinNavigationShield(): void {
  if (typeof sessionStorage === "undefined") return;
  if (!sessionStorage.getItem(STORAGE_KEY)) return;
  sessionStorage.removeItem(STORAGE_KEY);
  dispatchShieldChange();
}

function dispatchShieldChange(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(JOIN_NAV_SHIELD_EVENT));
}
