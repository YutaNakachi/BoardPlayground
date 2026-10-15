"use client";

import { useEffect, useMemo, useState } from "react";
import type { SiteAnnouncement } from "@/content/site-announcements";
import {
  formatAnnouncementDisplayDate,
  formatAnnouncementLine,
} from "@/lib/site-announcements";
import { AnnouncementScrollingText } from "@/components/AnnouncementScrollingText";

const ROTATE_MS = 6000;
const SLIDE_MS = 400;

type Props = {
  items: SiteAnnouncement[];
};

function AnnouncementRow({
  item,
  line,
}: {
  item: SiteAnnouncement;
  line: string;
}) {
  const dateLabel = formatAnnouncementDisplayDate(item);

  return (
    <div className="flex h-5 w-full shrink-0 items-center gap-3">
      {dateLabel ? (
        <time
          dateTime={item.startsAt}
          className="shrink-0 tabular-nums text-xs text-slate-500"
        >
          {dateLabel}
        </time>
      ) : null}
      <AnnouncementScrollingText item={item} line={line} />
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
