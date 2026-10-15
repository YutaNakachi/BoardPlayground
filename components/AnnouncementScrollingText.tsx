"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { SiteAnnouncement } from "@/content/site-announcements";
import { AnnouncementLink } from "@/components/AnnouncementLink";
import {
  ANNOUNCEMENT_BEFORE_VERTICAL_ROTATE_MS,
  ANNOUNCEMENT_MARQUEE_END_HOLD_MS,
  ANNOUNCEMENT_MARQUEE_START_HOLD_MS,
  ANNOUNCEMENT_STATIC_ROTATE_MS,
  announcementMarqueeDurationMs,
  measureAnnouncementOverflow,
} from "@/lib/announcement-display";

type Props = {
  item: SiteAnnouncement;
  line: string;
  /** 縦ローテでいま表示中の行だけ true（非表示行は横流れしない） */
  active: boolean;
  /** 1件だけのときは表示サイクルを繰り返す */
  loop?: boolean;
  onDisplayComplete?: () => void;
};

function delay(ms: number, signal: { cancelled: boolean }): Promise<void> {
  return new Promise((resolve) => {
    if (signal.cancelled) return;
    const id = window.setTimeout(() => {
      if (!signal.cancelled) resolve();
    }, ms);
    signal.timeouts.push(id);
  });
}

export function AnnouncementScrollingText({
  item,
  line,
  active,
  loop = false,
  onDisplayComplete,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [offsetX, setOffsetX] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);

  const linkClass =
    "whitespace-nowrap text-slate-200 transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";
  const staticClass = item.href
    ? `${linkClass} block min-w-0 truncate`
    : "block min-w-0 truncate text-slate-200";

  const measure = useCallback(() => {
    const container = containerRef.current;
    const measureEl = measureRef.current;
    if (!container || !measureEl) return null;
    return measureAnnouncementOverflow(
      container.clientWidth,
      measureEl.offsetWidth,
    );
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduceMotion(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!active) {
      setOffsetX(0);
      return;
    }

    const signal = { cancelled: false, timeouts: [] as number[] };
    let animation: Animation | null = null;

    const cleanup = () => {
      signal.cancelled = true;
      for (const id of signal.timeouts) window.clearTimeout(id);
      animation?.cancel();
      setOffsetX(0);
    };

    const runMarqueeOnce = async (distance: number) => {
      const track = trackRef.current;
      if (!track) return;

      const scrollMs = announcementMarqueeDurationMs(distance);
      setOffsetX(0);
      track.style.transform = "translateX(0)";

      await delay(ANNOUNCEMENT_MARQUEE_START_HOLD_MS, signal);
      if (signal.cancelled) return;

      animation = track.animate(
        [
          { transform: "translateX(0)" },
          { transform: `translateX(${-distance}px)` },
        ],
        { duration: scrollMs, easing: "linear", fill: "forwards" },
      );
      try {
        await animation.finished;
      } catch {
        return;
      }
      if (signal.cancelled) return;

      await delay(ANNOUNCEMENT_MARQUEE_END_HOLD_MS, signal);
      if (signal.cancelled) return;

      animation.cancel();
      setOffsetX(0);
      track.style.transform = "translateX(0)";

      await delay(ANNOUNCEMENT_BEFORE_VERTICAL_ROTATE_MS, signal);
    };

    const runCycle = async () => {
      while (!signal.cancelled) {
        const distance = measure();
        const useMarquee = distance !== null && !reduceMotion;

        if (!useMarquee) {
          setOffsetX(0);
          await delay(ANNOUNCEMENT_STATIC_ROTATE_MS, signal);
          if (signal.cancelled) return;
          if (!loop) {
            onDisplayComplete?.();
            return;
          }
          continue;
        }

        await runMarqueeOnce(distance);
        if (signal.cancelled) return;
        if (!loop) {
          onDisplayComplete?.();
          return;
        }
      }
    };

    const raf = window.requestAnimationFrame(() => {
      void runCycle();
    });

    return () => {
      window.cancelAnimationFrame(raf);
      cleanup();
    };
  }, [active, line, loop, reduceMotion, measure, onDisplayComplete]);

  const useTrack = active && !reduceMotion;

  return (
    <div ref={containerRef} className="relative min-w-0 flex-1 overflow-hidden">
      <span
        ref={measureRef}
        className="pointer-events-none invisible absolute left-0 top-0 whitespace-nowrap"
        aria-hidden
      >
        {line}
      </span>
      {useTrack ? (
        <div
          ref={trackRef}
          className="w-max will-change-transform"
          style={{ transform: `translateX(${offsetX}px)` }}
        >
          <AnnouncementLink item={item} line={line} className={linkClass} />
        </div>
      ) : (
        <AnnouncementLink item={item} line={line} className={staticClass} />
      )}
    </div>
  );
}
