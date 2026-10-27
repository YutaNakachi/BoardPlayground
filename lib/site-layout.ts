/**
 * サイト共通のコンテンツ幅。
 * xl（1280px）未満は従来どおり max-w-6xl。広い画面だけ段階的に広げる。
 */
export const SITE_MAX_WIDTH_CLASS =
  "mx-auto w-full max-w-6xl xl:max-w-7xl 2xl:max-w-[90rem]";

export const SITE_GUTTER_CLASS = "px-4 sm:px-6 lg:px-8";

export const SITE_CONTAINER_CLASS = `${SITE_MAX_WIDTH_CLASS} ${SITE_GUTTER_CLASS}`;

/** トップのゲームカードグリッド（lg まで従来どおり最大3列） */
export const CATALOG_GRID_CLASS =
  "grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";
