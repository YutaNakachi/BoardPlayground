"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { SiteAnnouncement } from "@/content/site-announcements";
import {
  formatAnnouncementDisplayDate,
  formatAnnouncementLine,
} from "@/lib/site-announcements";

const ROTATE_MS = 6000;
const SLIDE_MS = 400;

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
    return (
      <span className={className} title={line}>
        {line}
      </span>
    );
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

function AnnouncementRow({
  item,
  line,
}: {
  item: SiteAnnouncement;
  line: string;
}) {
  const dateLabel = formatAnnouncementDisplayDate(item);
  const linkClass =
    "min-w-0 truncate text-slate-200 transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

  return (
    <div className="flex h-5 shrink-0 items-center gap-3">
      {dateLabel ? (
        <time
          dateTime={item.startsAt}
          className="shrink-0 tabular-nums text-xs text-slate-500"
        >
          {dateLabel}
        </time>
      ) : null}
      <AnnouncementLink
        item={item}
        line={line}
        className={item.href ? linkClass : "min-w-0 truncate text-slate-200"}
      />
    </div>
  );
}

export function AnnouncementRotator({ items }: Props) {
  const lines = useMemo(
    () => items.map((item) => formatAnnouncementLine(item)),
    [items],
  );
  const [index, setIndex] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);
  const activeIndex =
    items.length > 0 ? ((index % items.length) + items.length) % items.length : 0;

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

  const slide = items.length > 1 && !reduceMotion;
  const current = items[activeIndex] ?? items[0];
  const currentLine = lines[activeIndex] ?? lines[0];

  return (
    <div
      className="h-5 min-w-0 flex-1 overflow-hidden"
      aria-live={slide ? "polite" : undefined}
    >
      {slide ? (
        <div
          className="flex flex-col transition-transform ease-out"
          style={{
            transform: `translateY(calc(-${activeIndex} * 1.25rem))`,
            transitionDuration: `${SLIDE_MS}ms`,
          }}
        >
          {items.map((item, i) => (
            <AnnouncementRow key={item.id} item={item} line={lines[i]} />
          ))}
        </div>
      ) : (
        <AnnouncementRow item={current} line={currentLine} />
      )}
    </div>
  );
}
