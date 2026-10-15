import {
  SITE_ANNOUNCEMENTS,
  type SiteAnnouncement,
} from "@/content/site-announcements";

/** 帯のローテに載せる最大件数 */
export const MAX_HOME_ANNOUNCEMENTS = 3;

/** 日付比較は JST の暦日（YYYY-MM-DD） */
const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

function toJstDateString(date: Date): string {
  const jst = new Date(date.getTime() + JST_OFFSET_MS);
  const y = jst.getUTCFullYear();
  const m = String(jst.getUTCMonth() + 1).padStart(2, "0");
  const d = String(jst.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function isWithinRange(
  item: SiteAnnouncement,
  todayJst: string,
): boolean {
  if (item.startsAt && todayJst < item.startsAt) return false;
  if (item.endsAt && todayJst > item.endsAt) return false;
  return true;
}

function sortKey(item: SiteAnnouncement): string {
  return item.startsAt ?? "0000-01-01";
}

export function formatAnnouncementLine(item: SiteAnnouncement): string {
  const text = item.body.trim();
  if (item.title?.trim()) {
    return `【${item.title.trim()}】${text}`;
  }
  return text;
}

/** 帯左に出す掲載日（startsAt）。未設定なら null */
export function formatAnnouncementDisplayDate(
  item: SiteAnnouncement,
): string | null {
  if (!item.startsAt) return null;
  const [y, m, d] = item.startsAt.split("-");
  if (!y || !m || !d) return item.startsAt;
  return `${y}/${m}/${d}`;
}

export function getActiveAnnouncements(
  now: Date = new Date(),
): SiteAnnouncement[] {
  const todayJst = toJstDateString(now);
  return SITE_ANNOUNCEMENTS.filter((item) => isWithinRange(item, todayJst))
    .sort((a, b) => sortKey(b).localeCompare(sortKey(a)))
    .slice(0, MAX_HOME_ANNOUNCEMENTS);
}
