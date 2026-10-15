/** 横流れ不要なお知らせの縦ローテ間隔 */
export const ANNOUNCEMENT_STATIC_ROTATE_MS = 6000;

/** 縦ローテで文頭を見せてから横流れを始めるまでの待ち */
export const ANNOUNCEMENT_MARQUEE_START_HOLD_MS = 1200;

/** 横流れで末尾まで見せたあと、文頭に戻る前の短い待ち */
export const ANNOUNCEMENT_MARQUEE_END_HOLD_MS = 400;

/** 文頭に戻ったあと、縦ローテへ進むまでの待ち */
export const ANNOUNCEMENT_BEFORE_VERTICAL_ROTATE_MS = 500;

export function announcementMarqueeDurationMs(distancePx: number): number {
  const seconds = Math.min(28, Math.max(10, distancePx / 32));
  return Math.round(seconds * 1000);
}

export function measureAnnouncementOverflow(
  containerWidth: number,
  contentWidth: number,
): number | null {
  const distance = contentWidth - containerWidth;
  if (distance > 4) return distance;
  return null;
}
