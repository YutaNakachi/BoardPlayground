import {
  announcementMarqueeDurationMs,
  measureAnnouncementOverflow,
} from "./announcement-display";

function assert(cond: boolean, message: string) {
  if (!cond) throw new Error(message);
}

assert(measureAnnouncementOverflow(100, 90) === null, "no overflow when content fits");
assert(measureAnnouncementOverflow(100, 120) === 20, "overflow distance");
assert(announcementMarqueeDurationMs(320) === 10000, "marquee min 10s");
assert(announcementMarqueeDurationMs(1000) === 28000, "marquee max 28s");

console.log("announcement-display.test.ts: ok");
