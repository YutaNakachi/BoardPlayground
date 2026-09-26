export const SITE_URL = "https://board-playground.vercel.app";
/** 制作代行ページを公開する場合は true にする */
export const SHOW_ABOUT_PAGE = false;

export const SITE_GUIDE_PATH = "/guide";
export const SITE_HELP_PATH = "/help";
export const SITE_CONTACT_PATH = "/contact";
export const SITE_PRIVACY_PATH = "/privacy";
export const SITE_TERMS_PATH = "/terms";
export const SITE_RANKING_PATH = "/ranking";

export const FOOTER_NAV_LINKS = [
  { href: "/", label: "トップ" },
  { href: SITE_RANKING_PATH, label: "ランキング" },
  { href: SITE_GUIDE_PATH, label: "このサイトについて" },
  { href: SITE_HELP_PATH, label: "ヘルプ" },
  { href: SITE_TERMS_PATH, label: "利用規約" },
  { href: SITE_PRIVACY_PATH, label: "プライバシー" },
  { href: SITE_CONTACT_PATH, label: "お問い合わせ" },
] as const;

export const COPYRIGHT_YEAR = 2026;
export const SITE_NAME = "ボドパッ！";
export const SITE_NAME_EN = "Board Game Park";
export const SITE_DESCRIPTION =
  "オリジナルルールのゲーム多数、テーブルゲームの遊び場。登録なし・インストールなしでパッ！と遊べる。";
export const SITE_TAGLINE = "ボードゲームを、もっと気軽に、もっと楽しく。";
export const SITE_NAME_EN_HERO = "~ Board Game Park ~";
export const SITE_TAGLINE_SUB =
  "オリジナルゲームも多数！登録不要・インストール不要ですぐ遊べる！";
export const CATALOG_HEADING = "今日は何で遊ぶ？";
export const BACK_TO_HOME_LABEL = "← ゲーム一覧";
