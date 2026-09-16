import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-surface-border bg-surface/80">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>
          掲載するのは、同じ盤面で対戦するゲームです。オリジナルと、商標を使わない伝統的な抽象ゲームを含みます。
        </p>
        <nav aria-label="フッター" className="flex flex-wrap gap-4">
          <Link href="/" className="transition hover:text-white">
            ゲーム一覧
          </Link>
          <Link href="/about" className="transition hover:text-white">
            制作代行について
          </Link>
        </nav>
      </div>
    </footer>
  );
}
