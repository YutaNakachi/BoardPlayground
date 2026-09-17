import { SITE_NAME } from "@/lib/site";

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-black">
      <div className="mx-auto max-w-6xl px-4 py-8 text-center text-sm text-[#86868b] sm:px-6">
        <p>{SITE_NAME}</p>
      </div>
    </footer>
  );
}
