"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePlayPage } from "@/components/play/PlayPageContext";
import { BACK_TO_HOME_LABEL } from "@/lib/site";

type Props = {
  className?: string;
};

export function PlayCatalogLink({
  className = "text-sm text-slate-400 transition hover:text-white",
}: Props) {
  const router = useRouter();
  const { exitPlayPage } = usePlayPage();

  return (
    <Link
      href="/"
      className={className}
      onClick={(event) => {
        event.preventDefault();
        exitPlayPage();
        router.push("/");
      }}
    >
      {BACK_TO_HOME_LABEL}
    </Link>
  );
}
