const LEGACY_SHIELD_KEY = "bp_join_nav_shield";

/** モーダル等で body の overflow が hidden のまま残ったときの復旧用 */
export function releaseBodyScrollLock(): void {
  if (typeof document === "undefined") return;
  document.body.style.overflow = "";
  try {
    sessionStorage.removeItem(LEGACY_SHIELD_KEY);
  } catch {
    // ignore
  }
}
