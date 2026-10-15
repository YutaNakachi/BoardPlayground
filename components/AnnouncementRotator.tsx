"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { SiteAnnouncement } from "@/content/site-announcements";
import {
  formatAnnouncementDisplayDate,
  formatAnnouncementLine,
} from "@/lib/site-announcements";
import { AnnouncementScrollingText } from "@/components/AnnouncementScrollingText";
import { ANNOUNCEMENT_STATIC_ROTATE_MS } from "@/lib/announcement-display";

const SLIDE_MS = 400;

type Props = {
  items: SiteAnnouncement[];
};

function AnnouncementRow({
  item,
  line,
  active,
  loop,
  onDisplayComplete,
}: {
  item: SiteAnnouncement;
  line: string;
  active: boolean;
  loop: boolean;
  onDisplayComplete?: () => void;
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
      <AnnouncementScrollingText
        item={item}
        line={line}
        active={active}
        loop={loop}
        onDisplayComplete={onDisplayComplete}
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

  const advance = useCallback(() => {
    setIndex((i) => (i + 1) % items.length);
  }, [items.length]);

  /** 動きを減らすときは横流れなし・固定6秒で縦ローテのみ */
  useEffect(() => {
    if (!reduceMotion || items.length <= 1) return;
    const id = window.setInterval(advance, ANNOUNCEMENT_STATIC_ROTATE_MS);
    return () => window.clearInterval(id);
  }, [items.length, reduceMotion, advance]);

  const slide = items.length > 1 && !reduceMotion;
  const loopSingle = items.length === 1 && !reduceMotion;
  const onDisplayComplete =
    !reduceMotion && items.length > 1 ? advance : undefined;

  const current = items[activeIndex] ?? items[0];
  const currentLine = lines[activeIndex] ?? lines[0];

  const rowProps = (i: number) => ({
    item: items[i],
    line: lines[i],
    active: slide ? i === activeIndex : true,
    loop: loopSingle,
    onDisplayComplete,
  });

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
            <AnnouncementRow key={item.id} {...rowProps(i)} />
          ))}
        </div>
      ) : (
        <AnnouncementRow key={current.id} {...rowProps(activeIndex)} item={current} line={currentLine} />
      )}
    </div>
  );
}
