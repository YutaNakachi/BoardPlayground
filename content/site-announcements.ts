export type SiteAnnouncement = {
  id: string;
  body: string;
  title?: string;
  href?: string;
  linkLabel?: string;
  /** 掲載開始日 YYYY-MM-DD（含む）。未指定なら常時 */
  startsAt?: string;
  /** 掲載終了日 YYYY-MM-DD（含む）。未指定なら無期限 */
  endsAt?: string;
};

/**
 * ホーム画面上部のお知らせ帯に出す項目。
 * 同時にローテ候補になるのは最大3件（lib/site-announcements.ts）。
 *
 * 例:
 * {
 *   id: "example",
 *   title: "新ゲーム",
 *   body: "リバーシをブラウザで遊べます",
 *   href: "/play/reversi",
 *   startsAt: "2026-10-01",
 *   endsAt: "2026-12-31",
 * }
 */
export const SITE_ANNOUNCEMENTS: SiteAnnouncement[] = [
  {
    id: "official-note",
    body: "ボドパッ！の公式noteを開設しました",
    href: "https://note.com/bodopa",
    startsAt: "2026-09-29",
  },
  {
    id: "new-game-dejarik",
    body: "【New】 『デジャリック』リリース！STAR WARSに登場したあのホログラムチェスを再現！",
    href: "/play/dejarik",
    startsAt: "2026-10-15",
  },
];
