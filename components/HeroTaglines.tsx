import { SITE_TAGLINE } from "@/lib/site";

export function HeroTaglines() {
  return (
    <p className="mt-4 text-xl font-bold text-white sm:mt-5 sm:text-2xl">
      <span className="sm:hidden">
        ボードゲームを、もっと気軽に、
        <br />
        もっと楽しく。
      </span>
      <span className="hidden sm:inline">{SITE_TAGLINE}</span>
    </p>
  );
}
