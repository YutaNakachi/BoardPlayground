import Link from "next/link";

export function Header() {
  return (
    <header className="border-b border-surface-border bg-surface/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-sm font-bold text-white">
            BP
          </span>
          <span className="hidden sm:inline">Board Playground</span>
        </Link>
        <nav className="flex gap-4 text-sm text-slate-400 sm:gap-6">
          <Link href="/" className="transition hover:text-white">
            ゲーム一覧
          </Link>
          <Link href="/about" className="transition hover:text-white">
            制作代行
          </Link>
        </nav>
      </div>
    </header>
  );
}
