/**
 * サイト共通のコンテンツ幅。
 * xl（1280px）未満は従来どおり max-w-6xl。広い画面だけ段階的に広げる。
 *
 * | ビューポート目安 | 最大幅 |
 * | --- | --- |
 * | 〜1279px | 72rem（6xl） |
 * | 1280〜1535px | 80rem（7xl） |
 * | 1536〜1679px | 90rem |
 * | 1680〜1919px | 104rem |
 * | 1920px〜 | 120rem |
 */
export const SITE_MAX_WIDTH_CLASS =
  "mx-auto w-full max-w-6xl xl:max-w-7xl 2xl:max-w-[90rem] min-[1680px]:max-w-[104rem] min-[1920px]:max-w-[120rem]";

export const SITE_GUTTER_CLASS = "px-4 sm:px-6 lg:px-8";

export const SITE_CONTAINER_CLASS = `${SITE_MAX_WIDTH_CLASS} ${SITE_GUTTER_CLASS}`;

/** トップのゲームカードグリッド（lg まで従来どおり最大3列） */
export const CATALOG_GRID_CLASS =
  "grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 min-[1680px]:grid-cols-5 min-[1920px]:grid-cols-6";
