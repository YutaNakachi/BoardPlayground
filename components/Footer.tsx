import Link from "next/link";
import { SiteBrand } from "@/components/SiteBrand";
import {
  COPYRIGHT_YEAR,
  FOOTER_NAV_LINKS,
  SITE_NAME,
} from "@/lib/site";

export function Footer() {
  return (
    <footer className="border-t border-surface-border bg-surface/80">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="flex flex-col items-center gap-6 text-center sm:gap-8">
          <SiteBrand variant="footer" />
          <nav aria-label="フッターナビゲーション">
            <ul className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-slate-400">
              {FOOTER_NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="transition hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <p className="text-xs text-slate-500">
            © {COPYRIGHT_YEAR} {SITE_NAME}
          </p>
        </div>
      </div>
    </footer>
  );
}
