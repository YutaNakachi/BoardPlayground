import { SITE_CONTAINER_CLASS } from "@/lib/site-layout";

type Props = {
  children: React.ReactNode;
  className?: string;
  padding?: "default" | "compact" | "home";
};

const PADDING_CLASS = {
  default: "py-10 sm:py-12",
  compact: "py-8",
  /** トップ：お知らせ帯直下のカタログ用（上だけ詰める） */
  home: "pt-4 pb-10 sm:pt-5 sm:pb-12",
} as const;

export function PageContainer({
  children,
  className = "",
  padding = "default",
}: Props) {
  return (
    <div
      className={`${SITE_CONTAINER_CLASS} ${PADDING_CLASS[padding]} ${className}`}
    >
      {children}
    </div>
  );
}
