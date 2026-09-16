import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "ページが見つかりません",
};

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <p className="text-sm font-medium tracking-widest text-accent">404</p>
      <h1 className="mt-3 text-3xl font-bold">ページが見つかりません</h1>
      <p className="mt-4 text-slate-400">
        URL が間違っているか、ページが移動した可能性があります。
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex min-h-11 items-center justify-center rounded-lg bg-accent px-5 font-medium text-white transition hover:bg-accent-hover"
      >
        ゲーム一覧へ戻る
      </Link>
    </div>
  );
}
