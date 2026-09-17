import { SITE_NAME, SITE_NAME_EN } from "@/lib/site";

type Props = {
  variant: "hero" | "header" | "footer";
};

export function SiteBrand({ variant }: Props) {
  if (variant === "hero") {
    return (
      <div className="space-y-3">
        <h1 className="font-display text-balance text-5xl font-extrabold tracking-tight sm:text-6xl">
          <span className="bg-gradient-to-r from-accent via-pink-300 to-accent-warm bg-clip-text text-transparent">
            {SITE_NAME}
          </span>
        </h1>
        <p className="text-base font-medium tracking-wide text-slate-400 sm:text-lg">
          {SITE_NAME_EN}
        </p>
      </div>
    );
  }

  if (variant === "header") {
    return (
      <span className="flex min-w-0 flex-col leading-none">
        <span className="truncate font-display text-base font-extrabold tracking-tight sm:text-lg">
          {SITE_NAME}
        </span>
        <span className="mt-0.5 hidden truncate text-[10px] font-medium tracking-wide text-slate-500 sm:block sm:text-[11px]">
          {SITE_NAME_EN}
        </span>
      </span>
    );
  }

  return (
    <p>
      {SITE_NAME}
      <span className="text-slate-600"> · </span>
      <span className="text-slate-600">{SITE_NAME_EN}</span>
    </p>
  );
}
