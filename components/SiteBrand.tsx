import Image from "next/image";
import { BRAND_ASSETS } from "@/lib/brand";
import { SITE_NAME, SITE_NAME_EN } from "@/lib/site";

type Props = {
  variant: "hero" | "header" | "footer";
};

export function SiteBrand({ variant }: Props) {
  if (variant === "hero") {
    return (
      <div className="mx-auto flex justify-center">
        <Image
          src={BRAND_ASSETS.fullLight}
          alt={SITE_NAME}
          width={1015}
          height={307}
          className="h-auto w-full max-w-sm sm:max-w-md"
          priority
        />
      </div>
    );
  }

  if (variant === "header") {
    return (
      <span className="flex min-w-0 items-center gap-2">
        <Image
          src={BRAND_ASSETS.symbol}
          alt=""
          width={512}
          height={512}
          className="h-8 w-8 shrink-0 rounded-lg sm:h-9 sm:w-9"
          aria-hidden
        />
        <Image
          src={BRAND_ASSETS.wordmarkLight}
          alt={SITE_NAME}
          width={1015}
          height={218}
          className="h-[1.125rem] w-auto max-w-[5.75rem] object-contain object-left min-[400px]:max-w-[8.5rem] sm:h-5 sm:max-w-[10.5rem]"
        />
      </span>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <Image
        src={BRAND_ASSETS.wordmarkLight}
        alt={SITE_NAME}
        width={1015}
        height={218}
        className="h-6 w-auto max-w-[11rem] mix-blend-lighten"
      />
      <p className="text-sm text-slate-400">{SITE_NAME_EN}</p>
    </div>
  );
}
