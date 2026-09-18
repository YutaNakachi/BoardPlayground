import Link from "next/link";
import { BACK_TO_HOME_LABEL } from "@/lib/site";

type Props = {
  className?: string;
};

export function BackToHomeLink({
  className = "text-sm text-slate-400 transition hover:text-white",
}: Props) {
  return (
    <Link href="/" className={className}>
      {BACK_TO_HOME_LABEL}
    </Link>
  );
}
