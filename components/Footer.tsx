import { SiteBrand } from "@/components/SiteBrand";

export function Footer() {
  return (
    <footer className="border-t border-surface-border bg-surface/80">
      <div className="mx-auto max-w-6xl px-4 py-8 text-center text-sm text-slate-500 sm:px-6">
        <SiteBrand variant="footer" />
      </div>
    </footer>
  );
}
