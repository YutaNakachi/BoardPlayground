"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { SiteAnnouncement } from "@/content/site-announcements";
import { formatAnnouncementLine } from "@/lib/site-announcements";

const ROTATE_MS = 6000;

type Props = {
  items: SiteAnnouncement[];
};

function AnnouncementLink({
  item,
  line,
  className,
}: {
  item: SiteAnnouncement;
  line: string;
  className: string;
}) {
  if (!item.href) {
    return <span className={className} title={line}>{line}</span>;
  }

  const external = /^https?:\/\//i.test(item.href);
  if (external) {
    return (
      <a
        href={item.href}
        className={className}
        title={line}
        target="_blank"
        rel="noopener noreferrer"
      >
        {line}
      </a>
    );
  }

  return (
    <Link href={item.href} className={className} title={line}>
      {line}
    </Link>
  );
}

export function AnnouncementRotator({ items }: Props) {
  const lines = useMemo(
    () => items.map((item) => formatAnnouncementLine(item)),
    [items],
  );
  const [index, setIndex] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduceMotion(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (reduceMotion || items.length <= 1) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % items.length);
    }, ROTATE_MS);
    return () => window.clearInterval(id);
  }, [items.length, reduceMotion]);

  const item = items[index] ?? items[0];
  const line = lines[index] ?? lines[0];
  const linkClass =
    "min-w-0 truncate text-slate-200 transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

  return (
    <div
      className="flex min-w-0 flex-1 items-center gap-2"
      aria-live={items.length > 1 && !reduceMotion ? "polite" : undefined}
    >
      <AnnouncementLink
        item={item}
        line={line}
        className={item.href ? linkClass : "min-w-0 truncate text-slate-200"}
      />
      {items.length > 1 && !reduceMotion ? (
        <span className="shrink-0 tabular-nums text-xs text-slate-500">
          {index + 1}/{items.length}
        </span>
      ) : null}
    </div>
  );
}
