import { SITE_TAGLINE, SITE_TAGLINE_SUB } from "@/lib/site";

export function HeroTaglines() {
  return (
    <>
      <p className="mt-6 text-xl font-bold text-white sm:text-2xl">
        <span className="sm:hidden">
          ボードゲームを、もっと気軽に、
          <br />
          もっと楽しく。
        </span>
        <span className="hidden sm:inline">{SITE_TAGLINE}</span>
      </p>
      <p className="mx-auto mt-3 max-w-lg text-base text-slate-400 sm:text-lg">
        <span className="sm:hidden">
          オリジナルゲームも多数！
          <br />
          登録不要・インストール不要ですぐ遊べる！
        </span>
        <span className="hidden sm:inline">{SITE_TAGLINE_SUB}</span>
      </p>
    </>
  );
}
