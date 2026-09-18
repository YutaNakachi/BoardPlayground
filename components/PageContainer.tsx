type Props = {
  children: React.ReactNode;
  className?: string;
  padding?: "default" | "compact";
};

const PADDING_CLASS = {
  default: "py-10 sm:py-12",
  compact: "py-8",
} as const;

export function PageContainer({
  children,
  className = "",
  padding = "default",
}: Props) {
  return (
    <div
      className={`mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 ${PADDING_CLASS[padding]} ${className}`}
    >
      {children}
    </div>
  );
}
