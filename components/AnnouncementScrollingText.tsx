"use client";

import { useEffect, useRef, useState } from "react";
import type { SiteAnnouncement } from "@/content/site-announcements";
import { AnnouncementLink } from "@/components/AnnouncementLink";

type Props = {
  item: SiteAnnouncement;
  line: string;
};

export function AnnouncementScrollingText({ item, line }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const [marquee, setMarquee] = useState<{
    distance: number;
    duration: number;
  } | null>(null);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduceMotion(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    const measure = measureRef.current;
    if (!container || !measure) return;

    const update = () => {
      const distance = measure.offsetWidth - container.clientWidth;
      if (distance > 4) {
        setMarquee({
          distance,
          duration: Math.min(28, Math.max(10, distance / 32)),
        });
      } else {
        setMarquee(null);
      }
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(container);
    return () => ro.disconnect();
  }, [line]);

  const linkClass =
    "whitespace-nowrap text-slate-200 transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";
  const staticClass = item.href
    ? `${linkClass} block min-w-0 truncate`
    : "block min-w-0 truncate text-slate-200";

  const useMarquee = marquee !== null && !reduceMotion;

  return (
    <div ref={containerRef} className="relative min-w-0 flex-1 overflow-hidden">
      <span
        ref={measureRef}
        className="pointer-events-none invisible absolute left-0 top-0 whitespace-nowrap"
        aria-hidden
      >
        {line}
      </span>
      {useMarquee ? (
        <div
          className="announcement-marquee-track w-max"
          style={
            {
              "--announcement-scroll-distance": `-${marquee.distance}px`,
              animationDuration: `${marquee.duration}s`,
            } as React.CSSProperties
          }
        >
          <AnnouncementLink item={item} line={line} className={linkClass} />
        </div>
      ) : (
        <AnnouncementLink item={item} line={line} className={staticClass} />
      )}
    </div>
  );
}
