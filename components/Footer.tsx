import { SITE_NAME } from "@/lib/site";

export function Footer() {
  return (
    <footer className="border-t border-surface-border bg-surface/80">
      <div className="mx-auto max-w-6xl px-4 py-6 text-center text-sm text-slate-500 sm:px-6">
        <p>{SITE_NAME}</p>
      </div>
    </footer>
  );
}
